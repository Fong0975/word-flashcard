package question

import (
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestDeleteQuestions tests the DeleteQuestions handler
func (suite *ControllerTestSuite) TestDeleteQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Delete(where).
		Return(int64(testID), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/questions/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}
