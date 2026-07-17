package question

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestListQuestions tests the ListQuestions handler
func (suite *ControllerTestSuite) TestListQuestions() {
	// Mock mockQuestionPeer methods as needed
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleQuestions(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions", nil)
	suite.controller.ListQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestion, err := json.Marshal(getExpectedQuestions())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestion), w.Body.String())
}
