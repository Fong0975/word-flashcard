package note

import (
	"fmt"
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestDeleteNote tests the DeleteNote handler
func (suite *ControllerTestSuite) TestDeleteNote() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Delete(where).
		Return(int64(testID), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/notes/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteNote(ctx)

	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	assert.Equal(suite.T(), "", w.Body.String())
}

// TestDeleteNoteInvalidID tests that an invalid note ID returns 400
func (suite *ControllerTestSuite) TestDeleteNoteInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/notes/abc", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.DeleteNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteNotePeerError tests that a database failure while deleting returns 500
func (suite *ControllerTestSuite) TestDeleteNotePeerError() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Delete(where).
		Return(int64(0), fmt.Errorf("delete failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/notes/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestDeleteNoteNotFound tests that deleting a non-existent note returns 404
func (suite *ControllerTestSuite) TestDeleteNoteNotFound() {
	testID := 999
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Delete(where).
		Return(int64(0), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/notes/999", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.DeleteNote(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}
