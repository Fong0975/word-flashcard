package word

import (
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestDeleteWord tests the DeleteWord handler
func (suite *ControllerTestSuite) TestDeleteWord() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: testWordID}

	// Mock wordPeer & wordDefinitionPeer methods as needed
	suite.mockWordPeer.EXPECT().
		Delete(whereWord).
		Return(int64(1), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(2), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}
