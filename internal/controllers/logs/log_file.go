package logs

import (
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"time"

	"word-flashcard/utils/config"
)

// DefaultLogFilePath mirrors the default in utils/log.InitLogger -- both must
// resolve to the same file, since that is the one this package reads back.
const DefaultLogFilePath = "word-flashcard.log"

// LogFileInfo describes one on-disk log file found by ListLogFiles.
type LogFileInfo struct {
	Path    string
	Name    string
	Size    int64
	ModTime time.Time
	Current bool
}

// LogFilePath returns the configured log file, matching how
// utils/log/logger.go:13 resolves it.
func LogFilePath() string {
	return config.GetOrDefault("LOG_FILE_PATH", DefaultLogFilePath)
}

// rotatedFileRE builds the pattern lumberjack uses for a rotated sibling of
// logFile: "<name>-<backup timestamp><ext>", where the timestamp is
// lumberjack's own "2006-01-02T15-04-05.000" layout. Matching it strictly
// keeps unrelated files in the same directory (a hand-saved
// word-flashcard-old.log, say) out of the listing.
func rotatedFileRE(base string) *regexp.Regexp {
	ext := filepath.Ext(base)
	name := base[:len(base)-len(ext)]

	return regexp.MustCompile(
		`^` + regexp.QuoteMeta(name) +
			`-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}` +
			regexp.QuoteMeta(ext) + `$`,
	)
}

// ListLogFiles returns the current log file plus every lumberjack-rotated
// sibling in the same directory, newest first.
//
// Ordering is derived from the names, not the filesystem mtimes: the current
// file is always newest, and a rotated name embeds a sortable timestamp. That
// keeps the order stable even when mtimes are unreliable, which is the same
// reasoning behind the sort in backup/backups_list.go.
//
// A missing directory is reported as no files rather than an error, since
// that is simply the "nothing logged yet" state.
func ListLogFiles(logFilePath string) ([]LogFileInfo, error) {
	dir := filepath.Dir(logFilePath)
	base := filepath.Base(logFilePath)

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	rotatedRE := rotatedFileRE(base)

	var current *LogFileInfo
	var rotated []LogFileInfo
	for _, entry := range entries {
		name := entry.Name()
		isCurrent := name == base
		if entry.IsDir() || (!isCurrent && !rotatedRE.MatchString(name)) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		file := LogFileInfo{
			Path:    filepath.Join(dir, name),
			Name:    name,
			Size:    info.Size(),
			ModTime: info.ModTime(),
			Current: isCurrent,
		}

		if isCurrent {
			current = &file
			continue
		}
		rotated = append(rotated, file)
	}

	// Descending by name puts the most recent rotation first, because the
	// embedded timestamp sorts lexicographically.
	sort.Slice(rotated, func(i, j int) bool {
		return rotated[i].Name > rotated[j].Name
	})

	if current == nil {
		return rotated, nil
	}

	return append([]LogFileInfo{*current}, rotated...), nil
}
