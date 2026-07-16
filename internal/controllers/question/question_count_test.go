package question

import (
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestCountQuestions tests the CountQuestions handler
func (suite *ControllerTestSuite) TestCountQuestions() {
	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Count().
		Return(int64(5), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/count", nil)
	suite.controller.CountQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := `{"count":5}`
	assert.Equal(suite.T(), expected, w.Body.String())
}
