package logs

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestNotifyLevel(t *testing.T) {
	tests := []struct {
		name   string
		envVar string
		want   string
	}{
		{name: "defaults to WARN", envVar: "", want: LevelWarn},
		{name: "uses the configured level", envVar: "ERROR", want: LevelError},
		{name: "is upper-cased", envVar: "error", want: LevelError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("LOG_NOTIFY_LEVEL", tt.envVar)

			if got := NotifyLevel(); got != tt.want {
				t.Errorf("NotifyLevel() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestReadStateFilePath(t *testing.T) {
	tests := []struct {
		name      string
		statePath string
		logPath   string
		want      string
	}{
		{
			name:    "defaults beside the log file",
			logPath: filepath.Join("logs", "word-flashcard.log"),
			want:    filepath.Join("logs", readStateFileName),
		},
		{
			name:    "defaults beside a log file in the working directory",
			logPath: "word-flashcard.log",
			want:    filepath.Join(".", readStateFileName),
		},
		{
			name:      "an explicit path wins",
			statePath: filepath.Join("custom", "state.json"),
			logPath:   filepath.Join("logs", "word-flashcard.log"),
			want:      filepath.Join("custom", "state.json"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("LOG_STATE_FILE_PATH", tt.statePath)
			t.Setenv("LOG_FILE_PATH", tt.logPath)

			if got := ReadStateFilePath(); got != tt.want {
				t.Errorf("ReadStateFilePath() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestLoadReadState(t *testing.T) {
	watermark := time.Date(2026, 8, 30, 20, 44, 13, 0, time.UTC)

	tests := []struct {
		name    string
		content string
		absent  bool
		want    time.Time
		wantErr bool
	}{
		{
			name:   "a missing file is the first-run state, not an error",
			absent: true,
			want:   time.Time{},
		},
		{
			name:    "reads a stored watermark",
			content: `{"last_read_at":"2026-08-30T20:44:13Z"}`,
			want:    watermark,
		},
		{
			name:    "malformed JSON returns the zero state and an error",
			content: "not json",
			want:    time.Time{},
			wantErr: true,
		},
		{
			name:    "an empty object leaves the watermark at zero",
			content: `{}`,
			want:    time.Time{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "state.json")
			if !tt.absent {
				if err := os.WriteFile(path, []byte(tt.content), 0o644); err != nil {
					t.Fatalf("failed to write state file: %v", err)
				}
			}

			got, err := LoadReadState(path)
			if (err != nil) != tt.wantErr {
				t.Fatalf("LoadReadState() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !got.LastReadAt.Equal(tt.want) {
				t.Errorf("LastReadAt = %v, want %v", got.LastReadAt, tt.want)
			}
		})
	}
}

func TestSaveReadState(t *testing.T) {
	watermark := time.Date(2026, 8, 30, 20, 44, 13, 0, time.UTC)

	tests := []struct {
		name   string
		subDir string
	}{
		{name: "writes into an existing directory"},
		{name: "creates the directory when missing", subDir: "nested"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), tt.subDir, "state.json")

			if err := SaveReadState(path, ReadState{LastReadAt: watermark}); err != nil {
				t.Fatalf("SaveReadState() error = %v", err)
			}

			got, err := LoadReadState(path)
			if err != nil {
				t.Fatalf("LoadReadState() error = %v", err)
			}
			if !got.LastReadAt.Equal(watermark) {
				t.Errorf("round-tripped LastReadAt = %v, want %v", got.LastReadAt, watermark)
			}
		})
	}
}
