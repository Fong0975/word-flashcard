package backup

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// TestWriteBackupFile verifies a successful build is written as an indented
// JSON file (creating the target directory if needed), that a BuildExport
// failure is surfaced without writing anything, and that a directory that
// can't be created (its path is already a plain file) also surfaces an error.
func (suite *ControllerTestSuite) TestWriteBackupFile() {
	tests := []struct {
		name       string
		setupMocks func()
		dir        func(t *testing.T) string
		wantErr    bool
	}{
		{
			name: "success writes an indented json file, creating the directory",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{sampleWord(1)}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Question{}, nil).Times(1)
				suite.mockNotePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Note{}, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordDefinition{}, nil).Times(1)
				suite.mockQuestionAnswerLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.QuestionAnswerLog{}, nil).Times(1)
				suite.mockWordPracticeLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordPracticeLog{}, nil).Times(1)
			},
			dir: func(t *testing.T) string {
				// A nested, not-yet-existing directory, so a successful
				// write also proves MkdirAll ran.
				return filepath.Join(t.TempDir(), "nested", "backups")
			},
		},
		{
			name: "BuildExport failure returns an error without writing a file",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, errors.New("select failed")).Times(1)
			},
			dir:     func(t *testing.T) string { return t.TempDir() },
			wantErr: true,
		},
		{
			name: "a directory path that already exists as a plain file returns an error",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Question{}, nil).Times(1)
				suite.mockNotePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Note{}, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordDefinition{}, nil).Times(1)
				suite.mockQuestionAnswerLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.QuestionAnswerLog{}, nil).Times(1)
				suite.mockWordPracticeLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordPracticeLog{}, nil).Times(1)
			},
			dir: func(t *testing.T) string {
				path := filepath.Join(t.TempDir(), "not-a-directory")
				suite.Require().NoError(os.WriteFile(path, []byte("x"), 0o644))
				return path
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			tt.setupMocks()
			dir := tt.dir(suite.T())

			path, err := suite.controller.WriteBackupFile(dir)

			if tt.wantErr {
				suite.Error(err)
				suite.Empty(path)
				return
			}

			suite.Require().NoError(err)
			suite.True(strings.HasPrefix(filepath.Base(path), BackupFilePrefix))
			suite.True(strings.HasSuffix(path, ".json"))

			data, err := os.ReadFile(path)
			suite.Require().NoError(err)

			var export models.DataExport
			suite.Require().NoError(json.Unmarshal(data, &export))
			suite.Len(export.Words, 1)
			// MarshalIndent output uses a 2-space indent per line after the first.
			suite.Contains(string(data), "\n  \"exported_at\"")
		})
	}
}

// writeFileWithModTime writes a file at path with an explicit modification
// time, so tests can control ordering deterministically instead of relying
// on real-time gaps between file creations.
func writeFileWithModTime(t *testing.T, path string, modTime time.Time) {
	t.Helper()

	require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
	require.NoError(t, os.WriteFile(path, []byte("{}"), 0o644))
	require.NoError(t, os.Chtimes(path, modTime, modTime))
}

// TestListBackupFiles covers every branch of listing backup files directly
// inside a directory: a missing directory, an empty directory, a mix of
// matching and non-matching names, and a subdirectory that must be ignored
// even if its name would otherwise match.
func TestListBackupFiles(t *testing.T) {
	now := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

	tests := []struct {
		name      string
		setupDir  func(t *testing.T) string
		wantNames []string
		wantErr   bool
	}{
		{
			name:     "missing directory returns no files and no error",
			setupDir: func(t *testing.T) string { return filepath.Join(t.TempDir(), "does-not-exist") },
		},
		{
			name:     "empty directory returns no files",
			setupDir: func(t *testing.T) string { return t.TempDir() },
		},
		{
			name: "mix of matching and non-matching files, and a subdirectory to ignore",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				writeFileWithModTime(t, filepath.Join(dir, BackupFilePrefix+"20240101-000000.json"), now)
				writeFileWithModTime(t, filepath.Join(dir, "word-flashcard-export-20240101-000000.json"), now)
				writeFileWithModTime(t, filepath.Join(dir, BackupFilePrefix+"stray.sql"), now)
				writeFileWithModTime(t, filepath.Join(dir, "local", BackupFilePrefix+"20240102-000000.json"), now)
				return dir
			},
			wantNames: []string{BackupFilePrefix + "20240101-000000.json"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := tt.setupDir(t)

			files, err := ListBackupFiles(dir)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)

			gotNames := make([]string, len(files))
			for i, f := range files {
				gotNames[i] = f.Name
				require.Equal(t, filepath.Join(dir, f.Name), f.Path)
			}
			require.ElementsMatch(t, tt.wantNames, gotNames)
		})
	}
}

// TestIsBackupFileName covers every branch of matching the on-disk naming
// convention WriteBackupFile uses.
func TestIsBackupFileName(t *testing.T) {
	tests := []struct {
		name     string
		fileName string
		want     bool
	}{
		{
			name:     "matches prefix and .json suffix",
			fileName: BackupFilePrefix + "20240101-000000.json",
			want:     true,
		},
		{
			name:     "wrong prefix is rejected",
			fileName: "word-flashcard-export-20240101-000000.json",
			want:     false,
		},
		{
			name:     "wrong extension is rejected",
			fileName: BackupFilePrefix + "20240101-000000.sql",
			want:     false,
		},
		{
			name:     "prefix without .json suffix at all is rejected",
			fileName: BackupFilePrefix + "20240101-000000",
			want:     false,
		},
		{
			name:     "unrelated file name is rejected",
			fileName: "notes.txt",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Equal(t, tt.want, IsBackupFileName(tt.fileName))
		})
	}
}
