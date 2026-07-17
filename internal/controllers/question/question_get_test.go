package question

import (
	"encoding/json"
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
