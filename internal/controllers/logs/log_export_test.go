package logs

import (
	"archive/zip"
	"bytes"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

// readArchive unpacks an in-memory zip into a name -> content map.
func readArchive(t *testing.T, content []byte) map[string]string {
	t.Helper()

	reader, err := zip.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		t.Fatalf("failed to open archive: %v", err)
	}

	entries := make(map[string]string, len(reader.File))
	for _, file := range reader.File {
		source, err := file.Open()
		if err != nil {
			t.Fatalf("failed to open archive entry %s: %v", file.Name, err)
		}
		data, err := io.ReadAll(source)
		source.Close()
		if err != nil {
			t.Fatalf("failed to read archive entry %s: %v", file.Name, err)
		}
		entries[file.Name] = string(data)
	}

	return entries
}

func TestBuildLogExport(t *testing.T) {
	// A non-UTC instant, so the archive name proves the stamp is converted.
	now := time.Date(2026, 1, 2, 3, 4, 5, 0, time.FixedZone("UTC+8", 8*60*60))

	tests := []struct {
		name            string
		files           map[string]string
		missingDir      bool
		wantNil         bool
		wantFileName    string
		wantContentType string
		wantRaw         string
		wantEntries     map[string]string
	}{
		{
			name:       "missing directory has nothing to export",
			missingDir: true,
			wantNil:    true,
		},
		{
			name:    "empty directory has nothing to export",
			wantNil: true,
		},
		{
			name:            "a lone current file is returned as-is",
			files:           map[string]string{"app.log": "current\n"},
			wantFileName:    "app.log",
			wantContentType: "text/plain; charset=utf-8",
			wantRaw:         "current\n",
		},
		{
			name:            "a lone rotated file is returned as-is",
			files:           map[string]string{"app-2026-08-30T10-00-00.000.log": "rotated\n"},
			wantFileName:    "app-2026-08-30T10-00-00.000.log",
			wantContentType: "text/plain; charset=utf-8",
			wantRaw:         "rotated\n",
		},
		{
			name: "unrelated files do not turn a lone log into an archive",
			files: map[string]string{
				"app.log":              "current\n",
				".log-read-state.json": "{}",
				"other.log":            "other\n",
			},
			wantFileName:    "app.log",
			wantContentType: "text/plain; charset=utf-8",
			wantRaw:         "current\n",
		},
		{
			name: "several files are zipped together",
			files: map[string]string{
				"app.log":                         "current\n",
				"app-2026-08-30T10-00-00.000.log": "rotated one\n",
				"app-2026-08-29T10-00-00.000.log": "rotated two\n",
				".log-read-state.json":            "{}",
			},
			wantFileName:    "app-logs-20260101-190405.zip",
			wantContentType: "application/zip",
			wantEntries: map[string]string{
				"app.log":                         "current\n",
				"app-2026-08-30T10-00-00.000.log": "rotated one\n",
				"app-2026-08-29T10-00-00.000.log": "rotated two\n",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			if tt.missingDir {
				dir = filepath.Join(dir, "does-not-exist")
			}
			for name, content := range tt.files {
				if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
					t.Fatalf("failed to create %s: %v", name, err)
				}
			}

			got, err := BuildLogExport(filepath.Join(dir, "app.log"), now)
			if err != nil {
				t.Fatalf("BuildLogExport() error = %v", err)
			}

			if tt.wantNil {
				if got != nil {
					t.Fatalf("BuildLogExport() = %+v, want nil", got)
				}
				return
			}
			if got == nil {
				t.Fatal("BuildLogExport() = nil, want an export")
			}

			if got.FileName != tt.wantFileName {
				t.Errorf("FileName = %q, want %q", got.FileName, tt.wantFileName)
			}
			if got.ContentType != tt.wantContentType {
				t.Errorf("ContentType = %q, want %q", got.ContentType, tt.wantContentType)
			}

			if tt.wantEntries == nil {
				if string(got.Content) != tt.wantRaw {
					t.Errorf("Content = %q, want %q", got.Content, tt.wantRaw)
				}
				return
			}
			if entries := readArchive(t, got.Content); !reflect.DeepEqual(entries, tt.wantEntries) {
				t.Errorf("archive entries = %v, want %v", entries, tt.wantEntries)
			}
		})
	}
}

func TestArchiveFileName(t *testing.T) {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name        string
		logFilePath string
		want        string
	}{
		{name: "bare file name", logFilePath: "word-flashcard.log", want: "word-flashcard-logs-20260101-000000.zip"},
		{name: "directory is dropped", logFilePath: filepath.Join("logs", "app.log"), want: "app-logs-20260101-000000.zip"},
		{name: "no extension", logFilePath: "app", want: "app-logs-20260101-000000.zip"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := archiveFileName(tt.logFilePath, now); got != tt.want {
				t.Errorf("archiveFileName() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestZipLogFiles(t *testing.T) {
	tests := []struct {
		name        string
		existing    map[string]string
		missing     []string
		wantWritten int
	}{
		{
			name:        "every file is archived",
			existing:    map[string]string{"app.log": "current\n", "app-2026-08-30T10-00-00.000.log": "rotated\n"},
			wantWritten: 2,
		},
		{
			name:        "a file rotated away since listing is skipped",
			existing:    map[string]string{"app.log": "current\n"},
			missing:     []string{"app-2026-08-30T10-00-00.000.log"},
			wantWritten: 1,
		},
		{
			name:        "nothing is written when every file is gone",
			existing:    map[string]string{},
			missing:     []string{"app.log", "app-2026-08-30T10-00-00.000.log"},
			wantWritten: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()

			var files []LogFileInfo
			for name, content := range tt.existing {
				if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
					t.Fatalf("failed to create %s: %v", name, err)
				}
				files = append(files, LogFileInfo{Path: filepath.Join(dir, name), Name: name})
			}
			for _, name := range tt.missing {
				files = append(files, LogFileInfo{Path: filepath.Join(dir, name), Name: name})
			}

			content, written, err := zipLogFiles(files)
			if err != nil {
				t.Fatalf("zipLogFiles() error = %v", err)
			}

			if written != tt.wantWritten {
				t.Errorf("written = %d, want %d", written, tt.wantWritten)
			}
			if entries := readArchive(t, content); !reflect.DeepEqual(entries, tt.existing) {
				t.Errorf("archive entries = %v, want %v", entries, tt.existing)
			}
		})
	}
}
