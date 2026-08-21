package backup

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
)

// TestTriggerBackup covers every branch of the TriggerBackup handler: a
// successful write returns the new file's metadata, a BuildExport failure
// surfaces a 500 without writing anything, and a backup directory that can't
// be created (its path is already a plain file) also surfaces a 500.
func (suite *ControllerTestSuite) TestTriggerBackup() {
	tests := []struct {
		name       string
		setupMocks func()
		dir        func() string
		wantStatus int
	}{
		{
			name: "success writes a file and returns its metadata",
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
			dir:        func() string { return suite.T().TempDir() },
			wantStatus: http.StatusOK,
		},
		{
			name: "BuildExport failure returns a 500 without writing a file",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, errors.New("select failed")).Times(1)
			},
			dir:        func() string { return suite.T().TempDir() },
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "a backup directory path that already exists as a plain file returns a 500",
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
			dir: func() string {
				path := filepath.Join(suite.T().TempDir(), "not-a-directory")
				suite.Require().NoError(os.WriteFile(path, []byte("x"), 0o644))
				return path
			},
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			tt.setupMocks()
			dir := tt.dir()
			suite.T().Setenv("BACKUP_DIR", dir)

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/data/backups", nil)
			suite.controller.TriggerBackup(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				entries, err := os.ReadDir(dir)
				if err == nil {
					for _, entry := range entries {
						suite.False(IsBackupFileName(entry.Name()), "no backup file should have been written on failure")
					}
				}
				return
			}

			var file models.BackupFile
			suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &file))
			suite.True(strings.HasPrefix(file.Name, BackupFilePrefix))
			suite.True(strings.HasSuffix(file.Name, ".json"))
			suite.Greater(file.SizeBytes, int64(0))

			_, err := os.Stat(filepath.Join(dir, file.Name))
			suite.NoError(err)
		})
	}
}
