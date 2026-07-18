package word

import (
	"fmt"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
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

// TestDeleteWordInvalidID tests that an invalid word ID returns 400
func (suite *ControllerTestSuite) TestDeleteWordInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/abc", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.DeleteWord(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteWordDefinitionsSelectError tests that a database failure while
// checking for associated definitions returns 500
func (suite *ControllerTestSuite) TestDeleteWordDefinitionsSelectError() {
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWord(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestDeleteWordNoDefinitions tests that a word with no associated
// definitions skips deleting definitions and still deletes the word
func (suite *ControllerTestSuite) TestDeleteWordNoDefinitions() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{}, nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Delete(whereWord).
		Return(int64(1), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWord(ctx)

	// wordDefinitionPeer.Delete has no expectation set above, so the mock
	// would fail this test if DeleteWord called it despite there being no
	// associated definitions to delete.
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
}

// TestDeleteWordDefinitionsDeleteError tests that a database failure while
// deleting associated definitions returns 500
func (suite *ControllerTestSuite) TestDeleteWordDefinitionsDeleteError() {
	testWordID := 1
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: testWordID}

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(0), fmt.Errorf("delete failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWord(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestDeleteWordPeerDeleteError tests that a database failure while deleting
// the word itself returns 500
func (suite *ControllerTestSuite) TestDeleteWordPeerDeleteError() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: testWordID}

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(2), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Delete(whereWord).
		Return(int64(0), fmt.Errorf("delete failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteWord(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestDeleteWordNotFound tests that deleting a non-existent word returns 404
func (suite *ControllerTestSuite) TestDeleteWordNotFound() {
	testWordID := 999
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: testWordID}

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(2), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Delete(whereWord).
		Return(int64(0), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/999", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.DeleteWord(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}
