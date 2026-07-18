package question

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGetQuestions tests the GetQuestions handler
func (suite *ControllerTestSuite) TestGetQuestions() {
	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{getSampleQuestions()[1]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/2", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "2"}}
	suite.controller.GetQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestion, err := json.Marshal(getExpectedQuestions()[1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestion), w.Body.String())
}

// TestGetQuestionsInvalidID tests that an invalid question ID returns 400
func (suite *ControllerTestSuite) TestGetQuestionsInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/abc", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.GetQuestions(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestGetQuestionsSelectError tests that a database failure while fetching returns 500
func (suite *ControllerTestSuite) TestGetQuestionsSelectError() {
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetQuestions(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestGetQuestionsNotFound tests that fetching a non-existent question returns 404
func (suite *ControllerTestSuite) TestGetQuestionsNotFound() {
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/999", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.GetQuestions(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestGetQuestionsMultipleRecords tests that more than one matching record returns 500
func (suite *ControllerTestSuite) TestGetQuestionsMultipleRecords() {
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{getSampleQuestions()[0], getSampleQuestions()[1]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetQuestions(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}
