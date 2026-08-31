package logs

import (
	"regexp"
	"strings"
	"time"

	"word-flashcard/internal/models"
)

// timestampLayout matches the format utils/log.CustomHandler writes
// (see utils/log/log_handler.go). The handler uses r.Time.Format, which
// emits local time with no zone information, so parsing must assume the
// server's local zone to round-trip correctly.
const timestampLayout = "2006/01/02 15:04:05"

// Log levels, ordered from least to most severe. The order is what
// LevelPriority and AtLeastLevel rely on.
const (
	LevelDebug = "DEBUG"
	LevelInfo  = "INFO"
	LevelWarn  = "WARN"
	LevelError = "ERROR"
)

var levelPriorities = map[string]int{
	LevelDebug: 0,
	LevelInfo:  1,
	LevelWarn:  2,
	LevelError: 3,
}

// entryHeadRE matches the first line of a log record, mirroring the
// "time | level | source | message" layout produced by
// utils/log/log_handler.go:54. Only the four levels InitLogger can select
// are accepted; anything else is treated as a continuation line so that
// multi-line values are never mistaken for new records.
var entryHeadRE = regexp.MustCompile(
	`^(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \| (DEBUG|INFO|WARN|ERROR) \| (\S+) \| (.*)$`,
)

// LevelPriority returns the severity rank of a level name, and false when
// the name is not one of the four levels this application emits.
func LevelPriority(level string) (int, bool) {
	priority, ok := levelPriorities[strings.ToUpper(level)]
	return priority, ok
}

// AtLeastLevel reports whether level is at least as severe as minimum.
// An unrecognised minimum imposes no constraint; an unrecognised level
// never satisfies a recognised minimum.
func AtLeastLevel(level, minimum string) bool {
	minPriority, ok := LevelPriority(minimum)
	if !ok {
		return true
	}

	priority, ok := LevelPriority(level)
	if !ok {
		return false
	}

	return priority >= minPriority
}

// ParseLogFile turns the raw contents of one log file into entries, in the
// order they were written (oldest first). fileName is recorded on every
// entry so the frontend can tell the current log from a rotated one.
//
// Lines that do not start a new record are appended to the previous entry's
// message. That is what keeps a panic's multi-line stack trace
// (see internal/middleware/recovery.go:22) as a single entry: the handler
// writes no continuation marker, so "does not look like a new record" is
// the only boundary signal available. Leading lines that arrive before any
// record header -- as happens when reading a file that rotation split
// mid-record -- have nothing to attach to and are dropped.
//
// IDs are left at zero; callers assign them, since the sequence depends on
// the filter and ordering being applied across files.
func ParseLogFile(content []byte, fileName string) []models.LogEntry {
	text := strings.TrimSuffix(string(content), "\n")
	if text == "" {
		return nil
	}

	var entries []models.LogEntry
	for _, line := range strings.Split(text, "\n") {
		line = strings.TrimSuffix(line, "\r")

		entry, ok := parseEntryHead(line, fileName)
		if !ok {
			if len(entries) > 0 {
				entries[len(entries)-1].Message += "\n" + line
			}
			continue
		}

		entries = append(entries, entry)
	}

	return entries
}

// parseEntryHead parses a single line as the start of a log record.
func parseEntryHead(line, fileName string) (models.LogEntry, bool) {
	match := entryHeadRE.FindStringSubmatch(line)
	if match == nil {
		return models.LogEntry{}, false
	}

	timestamp, err := time.ParseInLocation(timestampLayout, match[1], time.Local)
	if err != nil {
		return models.LogEntry{}, false
	}

	return models.LogEntry{
		Timestamp: timestamp,
		Level:     match[2],
		Source:    match[3],
		Message:   match[4],
		File:      fileName,
	}, true
}
