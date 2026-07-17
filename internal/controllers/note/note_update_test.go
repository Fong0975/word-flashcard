package note

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/utils"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestUpdateNote tests the UpdateNote handler
func (suite *ControllerTestSuite) TestUpdateNote() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}
	dbNote := getSampleNotes()[0]
	dbNote.Content = utils.StrPtr("# Grammar (Updated)\n- New rule")

	suite.mockNotePeer.EXPECT().
		Update(mock.MatchedBy(func(note *dbModels.Note) bool {
			return note.Content != nil && *note.Content == "# Grammar (Updated)\n- New rule"
		}), where).
		Return(int64(testID), nil).Times(1)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{dbNote}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"# Grammar (Updated)\n- New rule"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expected := getExpectedNotes()[0]
	expected.Content = utils.StrPtr("# Grammar (Updated)\n- New rule")
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestUpdateNoteInvalidID tests that an invalid note ID returns 400
func (suite *ControllerTestSuite) TestUpdateNoteInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"x"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/abc", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateNoteInvalidBody tests that a malformed JSON body returns 400
func (suite *ControllerTestSuite) TestUpdateNoteInvalidBody() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateNoteValidationError tests that a title exceeding the max length returns 400
func (suite *ControllerTestSuite) TestUpdateNoteValidationError() {
	tooLongTitle := strings.Repeat("a", 256)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"title":"` + tooLongTitle + `"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateNotePeerError tests that a database failure while updating returns 500
func (suite *ControllerTestSuite) TestUpdateNotePeerError() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(0), fmt.Errorf("update failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"x"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestUpdateNoteNotFound tests that updating a non-existent note returns 404
func (suite *ControllerTestSuite) TestUpdateNoteNotFound() {
	testID := 999
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(0), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"x"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/999", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestUpdateNoteSelectError tests that a database failure while fetching the
// updated note back returns 500
func (suite *ControllerTestSuite) TestUpdateNoteSelectError() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(testID), nil).Times(1)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"x"}`
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/notes/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}
