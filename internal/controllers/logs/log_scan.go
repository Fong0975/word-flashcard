package logs

import (
	"os"
	"strings"
	"time"

	"word-flashcard/internal/models"
)

// Filter narrows a scan. A zero Filter matches everything.
type Filter struct {
	// Levels is an allow-list of level names; empty means every level.
	Levels []string
	// From and To bound the entry timestamp inclusively; nil means unbounded.
	From *time.Time
	To   *time.Time
}

// Match reports whether an entry satisfies the filter.
func (f Filter) Match(entry models.LogEntry) bool {
	if len(f.Levels) > 0 && !containsLevel(f.Levels, entry.Level) {
		return false
	}
	if f.From != nil && entry.Timestamp.Before(*f.From) {
		return false
	}
	if f.To != nil && entry.Timestamp.After(*f.To) {
		return false
	}

	return true
}

func containsLevel(levels []string, level string) bool {
	for _, candidate := range levels {
		if strings.EqualFold(candidate, level) {
			return true
		}
	}

	return false
}

// walkEntries visits every entry matching filter, newest first, assigning
// each a 1-based sequence number. visit returning false stops the scan.
//
// Files are read one at a time and the parsed slice is released before the
// next one, so peak memory is bounded by the largest single log file
// (LOG_FILE_MAX_SIZE_MB, 10 MB by default) rather than by the whole
// rotation set. Within a file, entries are walked backwards because the
// handler appends oldest-first but the API reports newest-first.
func walkEntries(logFilePath string, filter Filter, visit func(models.LogEntry) bool) error {
	files, err := ListLogFiles(logFilePath)
	if err != nil {
		return err
	}

	sequence := 0
	for _, file := range files {
		content, err := os.ReadFile(file.Path)
		if err != nil {
			// A rotation between listing and reading is normal, not a failure.
			if os.IsNotExist(err) {
				continue
			}
			return err
		}

		entries := ParseLogFile(content, file.Name)
		for i := len(entries) - 1; i >= 0; i-- {
			entry := entries[i]
			if !filter.Match(entry) {
				continue
			}

			sequence++
			entry.ID = sequence
			if !visit(entry) {
				return nil
			}
		}
	}

	return nil
}

// ScanEntries returns one page of matching entries, newest first. It stops
// reading as soon as the page is full, so paging near the newest entries
// usually only touches the current log file.
func ScanEntries(logFilePath string, filter Filter, offset, limit int) ([]models.LogEntry, error) {
	entries := []models.LogEntry{}
	if limit <= 0 {
		return entries, nil
	}

	err := walkEntries(logFilePath, filter, func(entry models.LogEntry) bool {
		if entry.ID <= offset {
			return true
		}

		entries = append(entries, entry)
		return len(entries) < limit
	})
	if err != nil {
		return nil, err
	}

	return entries, nil
}

// CountEntries returns how many entries match the filter. Unlike
// ScanEntries it must read every file through to the end, but it holds no
// entries, so its memory use stays flat.
func CountEntries(logFilePath string, filter Filter) (int, error) {
	total := 0
	err := walkEntries(logFilePath, filter, func(entry models.LogEntry) bool {
		total = entry.ID
		return true
	})
	if err != nil {
		return 0, err
	}

	return total, nil
}

// CountUnread returns how many entries are newer than since and at least as
// severe as minLevel.
//
// Because walkEntries visits entries newest first and the log is written in
// chronological order, the first entry at or before the watermark means
// every remaining entry has already been read -- so the scan stops there
// instead of reading the rest of the rotation set. That early exit is what
// makes this endpoint cheap enough for the frontend to poll. The exception
// is the very first call, when the watermark is the zero time and there is
// nothing to stop at.
func CountUnread(logFilePath string, since time.Time, minLevel string) (int, error) {
	total := 0
	err := walkEntries(logFilePath, Filter{}, func(entry models.LogEntry) bool {
		if !entry.Timestamp.After(since) {
			return false
		}
		if AtLeastLevel(entry.Level, minLevel) {
			total++
		}

		return true
	})
	if err != nil {
		return 0, err
	}

	return total, nil
}
