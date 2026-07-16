package word

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestListWords tests the ListWords handler
func (suite *ControllerTestSuite) TestListWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleWords(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words", nil)
	suite.controller.ListWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord, err := json.Marshal(getExpectedWords())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}
