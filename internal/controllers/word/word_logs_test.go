package word

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"time"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGetWordLogs tests the GetWordLogs handler
func (suite *ControllerTestSuite) TestGetWordLogs() {
	testWordID := 1
	where := squirrel.Eq{schema.WORD_PRACTICE_LOG_WORD_ID: testWordID}
	limitPtr := uint64(10)

	logID1, logID2 := 1, 2
	green, yellow, red := "green", "yellow", "red"
	createdAt1 := time.Date(2026, 7, 10, 9, 0, 0, 0, time.UTC)
	createdAt2 := time.Date(2026, 7, 9, 15, 30, 0, 0, time.UTC)

	sampleLogs := []*dbModels.WordPracticeLog{
		{Id: &logID1, WordId: &testWordID, Familiarity: &green, PreviousFamiliarity: &yellow, CreatedAt: &createdAt1},
		{Id: &logID2, WordId: &testWordID, Familiarity: &yellow, PreviousFamiliarity: &red, CreatedAt: &createdAt2},
	}

	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, where, mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == "created_at DESC"
		}), &limitPtr, (*uint64)(nil)).
		Return(sampleLogs, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/1/logs", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetWordLogs(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expected := []models.WordPracticeLogEntry{
		{ID: 1, Familiarity: "green", PreviousFamiliarity: "yellow", CreatedAt: createdAt1},
		{ID: 2, Familiarity: "yellow", PreviousFamiliarity: "red", CreatedAt: createdAt2},
	}
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetWordLogsInvalidLimit tests that GetWordLogs rejects a limit outside 1-50.
func (suite *ControllerTestSuite) TestGetWordLogsInvalidLimit() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/1/logs?limit=51", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetWordLogs(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}
