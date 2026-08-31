package logs

import (
	"testing"
	"time"

	"word-flashcard/internal/models"
)

func TestLevelPriority(t *testing.T) {
	tests := []struct {
		name         string
		level        string
		wantPriority int
		wantOK       bool
	}{
		{name: "debug", level: "DEBUG", wantPriority: 0, wantOK: true},
		{name: "info", level: "INFO", wantPriority: 1, wantOK: true},
		{name: "warn", level: "WARN", wantPriority: 2, wantOK: true},
		{name: "error", level: "ERROR", wantPriority: 3, wantOK: true},
		{name: "lower case is accepted", level: "warn", wantPriority: 2, wantOK: true},
		{name: "unknown level", level: "TRACE", wantPriority: 0, wantOK: false},
		{name: "empty level", level: "", wantPriority: 0, wantOK: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			priority, ok := LevelPriority(tt.level)
			if ok != tt.wantOK {
				t.Fatalf("LevelPriority(%q) ok = %v, want %v", tt.level, ok, tt.wantOK)
			}
			if priority != tt.wantPriority {
				t.Errorf("LevelPriority(%q) = %d, want %d", tt.level, priority, tt.wantPriority)
			}
		})
	}
}

func TestAtLeastLevel(t *testing.T) {
	tests := []struct {
		name    string
		level   string
		minimum string
		want    bool
	}{
		{name: "equal levels match", level: "WARN", minimum: "WARN", want: true},
		{name: "more severe matches", level: "ERROR", minimum: "WARN", want: true},
		{name: "less severe does not match", level: "INFO", minimum: "WARN", want: false},
		{name: "debug against error", level: "DEBUG", minimum: "ERROR", want: false},
		{name: "case insensitive", level: "error", minimum: "warn", want: true},
		{name: "unknown minimum imposes no constraint", level: "DEBUG", minimum: "", want: true},
		{name: "unknown level fails a real minimum", level: "TRACE", minimum: "WARN", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := AtLeastLevel(tt.level, tt.minimum); got != tt.want {
				t.Errorf("AtLeastLevel(%q, %q) = %v, want %v", tt.level, tt.minimum, got, tt.want)
			}
		})
	}
}

func TestParseLogFile(t *testing.T) {
	at := func(hour, minute, second int) time.Time {
		return time.Date(2026, 8, 30, hour, minute, second, 0, time.Local)
	}

	tests := []struct {
		name    string
		content string
		want    []models.LogEntry
	}{
		{
			name:    "empty file",
			content: "",
			want:    nil,
		},
		{
			name:    "only a trailing newline",
			content: "\n",
			want:    nil,
		},
		{
			name:    "single entry",
			content: "2026/08/30 20:44:13 | INFO | main.go:49 | Starting server\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "Starting server",
					File:      "app.log",
				},
			},
		},
		{
			name: "every level is recognised",
			content: "2026/08/30 20:44:10 | DEBUG | a.go:1 | d\n" +
				"2026/08/30 20:44:11 | INFO | b.go:2 | i\n" +
				"2026/08/30 20:44:12 | WARN | c.go:3 | w\n" +
				"2026/08/30 20:44:13 | ERROR | d.go:4 | e\n",
			want: []models.LogEntry{
				{Timestamp: at(20, 44, 10), Level: "DEBUG", Source: "a.go:1", Message: "d", File: "app.log"},
				{Timestamp: at(20, 44, 11), Level: "INFO", Source: "b.go:2", Message: "i", File: "app.log"},
				{Timestamp: at(20, 44, 12), Level: "WARN", Source: "c.go:3", Message: "w", File: "app.log"},
				{Timestamp: at(20, 44, 13), Level: "ERROR", Source: "d.go:4", Message: "e", File: "app.log"},
			},
		},
		{
			name: "attributes containing separators stay in the message",
			content: "2026/08/30 20:44:13 | INFO | logging.go:38 | " +
				"Request processed [method=GET, path=/api/x?a=1, b=2, status=200]\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "logging.go:38",
					Message:   "Request processed [method=GET, path=/api/x?a=1, b=2, status=200]",
					File:      "app.log",
				},
			},
		},
		{
			name: "multi-line stack trace folds into one entry",
			content: "2026/08/30 20:44:13 | ERROR | recovery.go:22 | Panic recovered [stack=goroutine 1:\n" +
				"main.handler(0x1)\n" +
				"\t/root/main.go:10 +0x20]\n" +
				"2026/08/30 20:44:14 | INFO | main.go:49 | Next\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "ERROR",
					Source:    "recovery.go:22",
					Message: "Panic recovered [stack=goroutine 1:\n" +
						"main.handler(0x1)\n" +
						"\t/root/main.go:10 +0x20]",
					File: "app.log",
				},
				{
					Timestamp: at(20, 44, 14),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "Next",
					File:      "app.log",
				},
			},
		},
		{
			name: "leading orphan lines are dropped",
			content: "\t/root/main.go:10 +0x20]\n" +
				"2026/08/30 20:44:13 | INFO | main.go:49 | First real entry\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "First real entry",
					File:      "app.log",
				},
			},
		},
		{
			name: "truncated final line folds into the previous entry",
			content: "2026/08/30 20:44:13 | INFO | main.go:49 | Complete\n" +
				"2026/08/30 20:44:14 | INFO | main.g",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "Complete\n2026/08/30 20:44:14 | INFO | main.g",
					File:      "app.log",
				},
			},
		},
		{
			name:    "carriage returns are stripped",
			content: "2026/08/30 20:44:13 | INFO | main.go:49 | Starting server\r\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "Starting server",
					File:      "app.log",
				},
			},
		},
		{
			name: "an impossible timestamp is treated as a continuation",
			content: "2026/08/30 20:44:13 | INFO | main.go:49 | Real\n" +
				"2026/13/45 99:99:99 | INFO | fake.go:1 | Not a real timestamp\n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "Real\n2026/13/45 99:99:99 | INFO | fake.go:1 | Not a real timestamp",
					File:      "app.log",
				},
			},
		},
		{
			name:    "an unknown level is not a record boundary",
			content: "2026/08/30 20:44:13 | TRACE | main.go:49 | Unknown level\n",
			want:    nil,
		},
		{
			name:    "an empty message is preserved",
			content: "2026/08/30 20:44:13 | INFO | main.go:49 | \n",
			want: []models.LogEntry{
				{
					Timestamp: at(20, 44, 13),
					Level:     "INFO",
					Source:    "main.go:49",
					Message:   "",
					File:      "app.log",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ParseLogFile([]byte(tt.content), "app.log")

			if len(got) != len(tt.want) {
				t.Fatalf("got %d entries, want %d: %+v", len(got), len(tt.want), got)
			}
			for i := range tt.want {
				if !got[i].Timestamp.Equal(tt.want[i].Timestamp) {
					t.Errorf("entry %d timestamp = %v, want %v", i, got[i].Timestamp, tt.want[i].Timestamp)
				}
				if got[i].Level != tt.want[i].Level {
					t.Errorf("entry %d level = %q, want %q", i, got[i].Level, tt.want[i].Level)
				}
				if got[i].Source != tt.want[i].Source {
					t.Errorf("entry %d source = %q, want %q", i, got[i].Source, tt.want[i].Source)
				}
				if got[i].Message != tt.want[i].Message {
					t.Errorf("entry %d message = %q, want %q", i, got[i].Message, tt.want[i].Message)
				}
				if got[i].File != tt.want[i].File {
					t.Errorf("entry %d file = %q, want %q", i, got[i].File, tt.want[i].File)
				}
				if got[i].ID != 0 {
					t.Errorf("entry %d ID = %d, want 0 (callers assign IDs)", i, got[i].ID)
				}
			}
		})
	}
}
