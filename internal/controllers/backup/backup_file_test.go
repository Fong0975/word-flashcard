package backup

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/mock"
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
