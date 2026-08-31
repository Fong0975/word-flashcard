package logs

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"word-flashcard/internal/models"
)

func at(hour, minute, second int) time.Time {
	return time.Date(2026, 8, 30, hour, minute, second, 0, time.Local)
}

func ptr(t time.Time) *time.Time { return &t }

// writeScanFixture lays out a rotated log set whose entries, newest first,
// are D(WARN) C(INFO) B(ERROR) A(INFO). It returns the current file's path.
func writeScanFixture(t *testing.T) string {
	t.Helper()

	dir := t.TempDir()
	files := map[string]string{
		"app.log": "2026/08/30 20:44:12 | INFO | c.go:3 | C\n" +
			"2026/08/30 20:44:13 | WARN | d.go:4 | D\n",
		"app-2026-08-30T10-00-00.000.log": "2026/08/30 20:44:10 | INFO | a.go:1 | A\n" +
			"2026/08/30 20:44:11 | ERROR | b.go:2 | B\n",
	}

	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatalf("failed to write %s: %v", name, err)
		}
	}

	return filepath.Join(dir, "app.log")
}

func messagesOf(entries []models.LogEntry) []string {
	messages := make([]string, len(entries))
	for i, entry := range entries {
		messages[i] = entry.Message
	}

	return messages
}

func TestFilterMatch(t *testing.T) {
	entry := models.LogEntry{
		Timestamp: at(20, 44, 13),
		Level:     "WARN",
		Source:    "disk.go:12",
		Message:   "Disk almost full",
	}

	tests := []struct {
		name   string
		filter Filter
		want   bool
	}{
		{name: "zero filter matches everything", filter: Filter{}, want: true},
		{name: "matching level", filter: Filter{Levels: []string{"WARN"}}, want: true},
		{name: "level match is case insensitive", filter: Filter{Levels: []string{"warn"}}, want: true},
		{name: "one of several levels", filter: Filter{Levels: []string{"INFO", "WARN"}}, want: true},
		{name: "non-matching level", filter: Filter{Levels: []string{"ERROR"}}, want: false},
		{name: "inside the range", filter: Filter{From: ptr(at(20, 44, 12)), To: ptr(at(20, 44, 14))}, want: true},
		{name: "From is inclusive", filter: Filter{From: ptr(at(20, 44, 13))}, want: true},
		{name: "To is inclusive", filter: Filter{To: ptr(at(20, 44, 13))}, want: true},
		{name: "before From", filter: Filter{From: ptr(at(20, 44, 14))}, want: false},
		{name: "after To", filter: Filter{To: ptr(at(20, 44, 12))}, want: false},
		{
			name:   "level and range must both hold",
			filter: Filter{Levels: []string{"WARN"}, From: ptr(at(20, 44, 14))},
			want:   false,
		},
		{name: "keyword matches the message", filter: Filter{Keyword: "almost full"}, want: true},
		{name: "keyword matches the source", filter: Filter{Keyword: "disk.go"}, want: true},
		{name: "keyword match is case insensitive", filter: Filter{Keyword: "DISK"}, want: true},
		{name: "non-matching keyword", filter: Filter{Keyword: "database"}, want: false},
		{
			name:   "keyword and level must both hold",
			filter: Filter{Keyword: "disk", Levels: []string{"ERROR"}},
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.filter.Match(entry); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestScanEntries(t *testing.T) {
	tests := []struct {
		name         string
		filter       Filter
		offset       int
		limit        int
		missingFile  bool
		wantMessages []string
		wantIDs      []int
	}{
		{
			name:         "newest first across the current and rotated files",
			limit:        10,
			wantMessages: []string{"D", "C", "B", "A"},
			wantIDs:      []int{1, 2, 3, 4},
		},
		{
			name:         "first page",
			limit:        2,
			wantMessages: []string{"D", "C"},
			wantIDs:      []int{1, 2},
		},
		{
			name:         "second page continues the sequence",
			offset:       2,
			limit:        2,
			wantMessages: []string{"B", "A"},
			wantIDs:      []int{3, 4},
		},
		{
			name:         "offset beyond the end",
			offset:       10,
			limit:        10,
			wantMessages: []string{},
		},
		{
			name:         "zero limit returns nothing",
			limit:        0,
			wantMessages: []string{},
		},
		{
			name:         "level filter",
			filter:       Filter{Levels: []string{"WARN"}},
			limit:        10,
			wantMessages: []string{"D"},
			wantIDs:      []int{1},
		},
		{
			name:         "IDs are renumbered over the filtered set",
			filter:       Filter{Levels: []string{"INFO", "ERROR"}},
			limit:        10,
			wantMessages: []string{"C", "B", "A"},
			wantIDs:      []int{1, 2, 3},
		},
		{
			name:         "From bound",
			filter:       Filter{From: ptr(at(20, 44, 11))},
			limit:        10,
			wantMessages: []string{"D", "C", "B"},
			wantIDs:      []int{1, 2, 3},
		},
		{
			name:         "To bound",
			filter:       Filter{To: ptr(at(20, 44, 11))},
			limit:        10,
			wantMessages: []string{"B", "A"},
			wantIDs:      []int{1, 2},
		},
		{
			name:         "keyword filter matches the source",
			filter:       Filter{Keyword: "c.go"},
			limit:        10,
			wantMessages: []string{"C"},
			wantIDs:      []int{1},
		},
		{
			name:         "missing log directory yields no entries",
			limit:        10,
			missingFile:  true,
			wantMessages: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := writeScanFixture(t)
			if tt.missingFile {
				path = filepath.Join(t.TempDir(), "absent", "app.log")
			}

			got, err := ScanEntries(path, tt.filter, tt.offset, tt.limit)
			if err != nil {
				t.Fatalf("ScanEntries() error = %v", err)
			}

			messages := messagesOf(got)
			if len(messages) != len(tt.wantMessages) {
				t.Fatalf("got %v, want %v", messages, tt.wantMessages)
			}
			for i := range tt.wantMessages {
				if messages[i] != tt.wantMessages[i] {
					t.Errorf("entry %d message = %q, want %q", i, messages[i], tt.wantMessages[i])
				}
				if i < len(tt.wantIDs) && got[i].ID != tt.wantIDs[i] {
					t.Errorf("entry %d ID = %d, want %d", i, got[i].ID, tt.wantIDs[i])
				}
			}
		})
	}
}

func TestCountEntries(t *testing.T) {
	tests := []struct {
		name        string
		filter      Filter
		missingFile bool
		want        int
	}{
		{name: "counts every entry across files", want: 4},
		{name: "level filter", filter: Filter{Levels: []string{"INFO"}}, want: 2},
		{name: "several levels", filter: Filter{Levels: []string{"WARN", "ERROR"}}, want: 2},
		{name: "range filter", filter: Filter{From: ptr(at(20, 44, 12))}, want: 2},
		{name: "range excluding everything", filter: Filter{From: ptr(at(23, 0, 0))}, want: 0},
		{name: "keyword filter", filter: Filter{Keyword: "c.go"}, want: 1},
		{name: "missing log directory counts zero", missingFile: true, want: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := writeScanFixture(t)
			if tt.missingFile {
				path = filepath.Join(t.TempDir(), "absent", "app.log")
			}

			got, err := CountEntries(path, tt.filter)
			if err != nil {
				t.Fatalf("CountEntries() error = %v", err)
			}
			if got != tt.want {
				t.Errorf("CountEntries() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestCountUnread(t *testing.T) {
	tests := []struct {
		name     string
		since    time.Time
		minLevel string
		want     int
	}{
		{name: "zero watermark counts every entry at the level", minLevel: LevelWarn, want: 2},
		{name: "watermark below everything", since: at(20, 44, 9), minLevel: LevelWarn, want: 2},
		{
			name:     "watermark is exclusive at its own entry",
			since:    at(20, 44, 11),
			minLevel: LevelWarn,
			want:     1,
		},
		{name: "watermark above everything", since: at(20, 44, 59), minLevel: LevelWarn, want: 0},
		{name: "a stricter level excludes warnings", minLevel: LevelError, want: 1},
		{name: "a permissive level counts everything", minLevel: LevelDebug, want: 4},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CountUnread(writeScanFixture(t), tt.since, tt.minLevel)
			if err != nil {
				t.Fatalf("CountUnread() error = %v", err)
			}
			if got != tt.want {
				t.Errorf("CountUnread() = %d, want %d", got, tt.want)
			}
		})
	}
}

// TestCountUnreadStopsAtTheWatermark proves the scan really does stop at the
// first already-read entry instead of reading the whole rotation set. The
// rotated file is given a deliberately impossible timestamp -- newer than
// anything in the current file -- so it would be counted if the walk ever
// reached it. That early exit is what makes the endpoint cheap to poll.
func TestCountUnreadStopsAtTheWatermark(t *testing.T) {
	dir := t.TempDir()
	files := map[string]string{
		"app.log": "2026/08/30 20:44:12 | WARN | c.go:3 | C\n" +
			"2026/08/30 20:44:13 | WARN | d.go:4 | D\n",
		"app-2026-08-30T10-00-00.000.log": "2026/08/30 23:00:00 | ERROR | z.go:9 | Z\n",
	}
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatalf("failed to write %s: %v", name, err)
		}
	}
	path := filepath.Join(dir, "app.log")

	// Stopping at C leaves only D counted; without the early exit Z would
	// also be counted, giving 2.
	got, err := CountUnread(path, at(20, 44, 12), LevelWarn)
	if err != nil {
		t.Fatalf("CountUnread() error = %v", err)
	}
	if got != 1 {
		t.Errorf("CountUnread() = %d, want 1 (scan should stop at the watermark)", got)
	}

	// With a watermark below everything there is nothing to stop at, so the
	// rotated file is reached and Z is counted.
	got, err = CountUnread(path, at(20, 0, 0), LevelWarn)
	if err != nil {
		t.Fatalf("CountUnread() error = %v", err)
	}
	if got != 3 {
		t.Errorf("CountUnread() = %d, want 3 (whole set scanned)", got)
	}
}
