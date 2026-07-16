package question

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGetQuestionLogs tests the GetQuestionLogs handler
func (suite *ControllerTestSuite) TestGetQuestionLogs() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ANSWER_LOG_QUESTION_ID: testID}
	limitPtr := uint64(15)

	suite.mockQuestionAnswerLogPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, &limitPtr, (*uint64)(nil)).
		Return(getSampleQuestionAnswerLogs(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/1/logs", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetQuestionLogs(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected, err := json.Marshal(getExpectedQuestionAnswerLogEntries())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expected), w.Body.String())
}
