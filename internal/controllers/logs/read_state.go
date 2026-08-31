package logs

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"time"

	"word-flashcard/utils/config"
)

const (
	// DefaultNotifyLevel is the severity at or above which unread entries
	// raise the frontend's unread indicator.
	DefaultNotifyLevel = LevelWarn

	// readStateFileName is the watermark file kept beside the log files.
	readStateFileName = ".log-read-state.json"
)

// ReadState is the persisted "everything up to here has been seen" mark.
//
// It is a single global timestamp, deliberately independent of whatever
// level or date filter the log page happens to be showing: advancing it
// marks every earlier entry read, including ones a filter was hiding at the
// time. The timestamp compared against is the one parsed out of the log line
// itself, never a file mtime and never LogEntry.ID -- IDs are scan sequence
// numbers that shift whenever new lines are written (see models.LogEntry).
type ReadState struct {
	LastReadAt time.Time `json:"last_read_at"`
}

// NotifyLevel returns the minimum severity that counts towards the unread
// total, from LOG_NOTIFY_LEVEL.
func NotifyLevel() string {
	return strings.ToUpper(config.GetOrDefault("LOG_NOTIFY_LEVEL", DefaultNotifyLevel))
}

// ReadStateFilePath returns where the watermark is stored: LOG_STATE_FILE_PATH
// when set, otherwise a dotfile alongside the log files. That directory is
// already bind-mounted in deployment (LOG_HOST_DIR), so the watermark
// survives a container rebuild without needing a volume of its own.
func ReadStateFilePath() string {
	if path := config.GetOrDefault("LOG_STATE_FILE_PATH", ""); path != "" {
		return path
	}

	return filepath.Join(filepath.Dir(LogFilePath()), readStateFileName)
}

// LoadReadState reads the watermark. A missing file is not an error: it is
// the first-run state, and a zero timestamp correctly makes every entry
// unread. A file that exists but cannot be read or parsed returns the zero
// state alongside the error, so callers can degrade rather than fail.
func LoadReadState(path string) (ReadState, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return ReadState{}, nil
		}
		return ReadState{}, err
	}

	var state ReadState
	if err := json.Unmarshal(data, &state); err != nil {
		return ReadState{}, err
	}

	return state, nil
}

// SaveReadState writes the watermark, creating its directory if needed.
func SaveReadState(path string, state ReadState) error {
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o644)
}
