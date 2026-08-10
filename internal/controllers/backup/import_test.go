package backup

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
)

// validImportBody returns a full, internally-consistent DataExport (foreign
// keys pointing at rows present in the same payload), marshaled to JSON.
func validImportBody(suite *ControllerTestSuite) []byte {
	export := models.DataExport{
		Words:              []*dbModels.Word{sampleWord(1)},
		Questions:          []*dbModels.Question{sampleQuestion(1)},
		Notes:              []*dbModels.Note{sampleNote(1)},
		WordDefinitions:    []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
		QuestionAnswerLogs: []*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)},
		WordPracticeLogs:   []*dbModels.WordPracticeLog{sampleWordPracticeLog(1, 1)},
	}

	body, err := json.Marshal(export)
	suite.Require().NoError(err)
	return body
}

// TestImportData verifies a well-formed export restores successfully and
// reports accurate per-table counts, while a missing body, malformed JSON,
// a row missing a required field, or a restore failure all stop the request
// with the appropriate status before (or despite) touching the database.
func (suite *ControllerTestSuite) TestImportData() {
	restoreErr := errors.New("restore failed")

	tests := []struct {
		name       string
		body       []byte
		noBody     bool
		setupMocks func()
		wantStatus int
	}{
		{
			name:       "empty body returns 400",
			noBody:     true,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "malformed json returns 400",
			body:       []byte(`{"words":`),
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "row missing a required field returns 400",
			body: func() []byte {
				word := sampleWord(1)
				word.Word = nil
				export := models.DataExport{Words: []*dbModels.Word{word}}
				body, err := json.Marshal(export)
				suite.Require().NoError(err)
				return body
			}(),
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "restore failure returns 500",
			body: validImportBody(suite),
			setupMocks: func() {
				suite.mockBackupPeer.EXPECT().RestoreAll(mock.Anything).Return(restoreErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "success restores and returns row counts",
			body: validImportBody(suite),
			setupMocks: func() {
				suite.mockBackupPeer.EXPECT().RestoreAll(mock.Anything).Return(nil).Times(1)
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			if tt.setupMocks != nil {
				tt.setupMocks()
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			if tt.noBody {
				ctx.Request = httptest.NewRequest(http.MethodPost, "/api/data/import", nil)
			} else {
				ctx.Request = httptest.NewRequest(http.MethodPost, "/api/data/import", io.NopCloser(bytes.NewReader(tt.body)))
				ctx.Request.ContentLength = int64(len(tt.body))
			}
			suite.controller.ImportData(ctx)

			suite.Equal(tt.wantStatus, w.Code)

			if tt.wantStatus == http.StatusOK {
				var summary models.ImportSummary
				suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &summary))
				suite.Equal(1, summary.Words)
				suite.Equal(1, summary.Questions)
				suite.Equal(1, summary.Notes)
				suite.Equal(1, summary.WordDefinitions)
				suite.Equal(1, summary.QuestionAnswerLogs)
				suite.Equal(1, summary.WordPracticeLogs)
			}
		})
	}
}
