package note

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

// TestGetNote tests the GetNote handler
func (suite *ControllerTestSuite) TestGetNote() {
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{getSampleNotes()[1]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/2", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "2"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes()[1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetNoteInvalidID tests that an invalid note ID returns 400
func (suite *ControllerTestSuite) TestGetNoteInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/abc", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestGetNoteSelectError tests that a database failure while fetching returns 500
func (suite *ControllerTestSuite) TestGetNoteSelectError() {
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestGetNoteNotFound tests that fetching a non-existent note returns 404
func (suite *ControllerTestSuite) TestGetNoteNotFound() {
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/999", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestGetNoteMultipleRecords tests that more than one matching record returns 500
func (suite *ControllerTestSuite) TestGetNoteMultipleRecords() {
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{getSampleNotes()[0], getSampleNotes()[1]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}
