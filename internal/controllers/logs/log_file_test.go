package logs

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLogFilePath(t *testing.T) {
	tests := []struct {
		name   string
		envVar string
		want   string
	}{
		{name: "falls back to the InitLogger default", envVar: "", want: DefaultLogFilePath},
		{name: "uses the configured path", envVar: "logs/word-flashcard.log", want: "logs/word-flashcard.log"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("LOG_FILE_PATH", tt.envVar)

			if got := LogFilePath(); got != tt.want {
				t.Errorf("LogFilePath() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestListLogFiles(t *testing.T) {
	tests := []struct {
		name       string
		files      []string
		dirs       []string
		missingDir bool
		wantNames  []string
	}{
		{
			name:       "missing directory reports no files",
			missingDir: true,
			wantNames:  nil,
		},
		{
			name:      "empty directory reports no files",
			wantNames: nil,
		},
		{
			name:      "current file only",
			files:     []string{"app.log"},
			wantNames: []string{"app.log"},
		},
		{
			name: "current file comes before rotations, newest rotation first",
			files: []string{
				"app-2026-08-28T10-00-00.000.log",
				"app.log",
				"app-2026-08-30T20-44-51.123.log",
				"app-2026-08-29T12-30-00.500.log",
			},
			wantNames: []string{
				"app.log",
				"app-2026-08-30T20-44-51.123.log",
				"app-2026-08-29T12-30-00.500.log",
				"app-2026-08-28T10-00-00.000.log",
			},
		},
		{
			name: "rotations are listed even without a current file",
			files: []string{
				"app-2026-08-29T12-30-00.500.log",
				"app-2026-08-30T20-44-51.123.log",
			},
			wantNames: []string{
				"app-2026-08-30T20-44-51.123.log",
				"app-2026-08-29T12-30-00.500.log",
			},
		},
		{
			name: "unrelated files are ignored",
			files: []string{
				"app.log",
				"app-old.log",
				"app-2026-08-30T20-44-51.log",
				"app.log.bak",
				"other.log",
				"app-2026-08-30T20-44-51.123.txt",
			},
			wantNames: []string{"app.log"},
		},
		{
			name:      "directories are ignored",
			files:     []string{"app.log"},
			dirs:      []string{"app-2026-08-30T20-44-51.123.log"},
			wantNames: []string{"app.log"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			if tt.missingDir {
				dir = filepath.Join(dir, "does-not-exist")
			}

			for _, name := range tt.files {
				if err := os.WriteFile(filepath.Join(dir, name), []byte("x"), 0o644); err != nil {
					t.Fatalf("failed to create %s: %v", name, err)
				}
			}
			for _, name := range tt.dirs {
				if err := os.Mkdir(filepath.Join(dir, name), 0o755); err != nil {
					t.Fatalf("failed to create directory %s: %v", name, err)
				}
			}

			got, err := ListLogFiles(filepath.Join(dir, "app.log"))
			if err != nil {
				t.Fatalf("ListLogFiles() error = %v", err)
			}

			if len(got) != len(tt.wantNames) {
				t.Fatalf("got %d files, want %d: %+v", len(got), len(tt.wantNames), got)
			}
			for i, wantName := range tt.wantNames {
				if got[i].Name != wantName {
					t.Errorf("file %d = %q, want %q", i, got[i].Name, wantName)
				}
				if wantCurrent := wantName == "app.log"; got[i].Current != wantCurrent {
					t.Errorf("file %d Current = %v, want %v", i, got[i].Current, wantCurrent)
				}
				if got[i].Path != filepath.Join(dir, wantName) {
					t.Errorf("file %d path = %q, want %q", i, got[i].Path, filepath.Join(dir, wantName))
				}
			}
		})
	}
}
