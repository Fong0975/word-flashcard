package question

import (
	"fmt"
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

// TestDeleteQuestionsInvalidID tests that an invalid question ID returns 400
func (suite *ControllerTestSuite) TestDeleteQuestionsInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/questions/abc", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.DeleteQuestions(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteQuestionsPeerError tests that a database failure while deleting returns 500
func (suite *ControllerTestSuite) TestDeleteQuestionsPeerError() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}

	suite.mockQuestionPeer.EXPECT().
		Delete(where).
		Return(int64(0), fmt.Errorf("delete failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/questions/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteQuestions(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestDeleteQuestionsNotFound tests that deleting a non-existent question returns 404
func (suite *ControllerTestSuite) TestDeleteQuestionsNotFound() {
	testID := 999
	where := squirrel.Eq{schema.QUESTION_ID: testID}

	suite.mockQuestionPeer.EXPECT().
		Delete(where).
		Return(int64(0), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/questions/999", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.DeleteQuestions(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}
