package word

import (
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestDeleteWordDefinition tests the DeleteWordDefinition handler
func (suite *ControllerTestSuite) TestDeleteWordDefinition() {
	testDefinitionID := 1
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_ID: testDefinitionID}

	// Mock wordDefinitionPeer methods as needed
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(1), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/definition/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWordDefinition(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}
