package backup

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
)

// TestExportData verifies every table is fetched and assembled into a
// single export, and that a failure fetching any one table stops the
// request with a 500 before any later table is queried.
func (suite *ControllerTestSuite) TestExportData() {
	fetchErr := errors.New("select failed")

	tests := []struct {
		name       string
		setupMocks func()
		wantStatus int
	}{
		{
			name: "success returns every table",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{sampleWord(1)}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Question{sampleQuestion(1)}, nil).Times(1)
				suite.mockNotePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Note{sampleNote(1)}, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordDefinition{sampleWordDefinition(1, 1)}, nil).Times(1)
				suite.mockQuestionAnswerLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)}, nil).Times(1)
				suite.mockWordPracticeLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.WordPracticeLog{sampleWordPracticeLog(1, 1)}, nil).Times(1)
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "word peer failure",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "question peer failure",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "note peer failure",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Question{}, nil).Times(1)
				suite.mockNotePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "word definition peer failure",
			setupMocks: func() {
				suite.mockWordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Word{}, nil).Times(1)
				suite.mockQuestionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Question{}, nil).Times(1)
				suite.mockNotePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return([]*dbModels.Note{}, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "question answer log peer failure",
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
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "word practice log peer failure",
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
					Return(nil, fetchErr).Times(1)
			},
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			tt.setupMocks()

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/data/export", nil)
			suite.controller.ExportData(ctx)

			suite.Equal(tt.wantStatus, w.Code)

			if tt.wantStatus == http.StatusOK {
				suite.True(strings.HasPrefix(w.Header().Get("Content-Disposition"), "attachment; filename="))

				var export models.DataExport
				suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &export))
				suite.Len(export.Words, 1)
				suite.Len(export.Questions, 1)
				suite.Len(export.Notes, 1)
				suite.Len(export.WordDefinitions, 1)
				suite.Len(export.QuestionAnswerLogs, 1)
				suite.Len(export.WordPracticeLogs, 1)
			}
		})
	}
}
