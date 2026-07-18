package note

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestCreateNote tests the CreateNote handler
func (suite *ControllerTestSuite) TestCreateNote() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: int64(testID)}

	suite.mockNotePeer.EXPECT().
		Insert(mock.MatchedBy(func(note *dbModels.Note) bool {
			return note != nil && note.Title != nil && *note.Title != ""
		})).
		Return(int64(testID), nil).Times(1)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{getSampleNotes()[0]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"title":"Grammar Rules","content":"# Grammar\n- Subject-Verb Agreement","sort_order":1}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateNote(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes()[0])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestCreateNoteInvalidBody tests that a malformed JSON body returns 400
func (suite *ControllerTestSuite) TestCreateNoteInvalidBody() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"title":`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestCreateNoteValidationError tests that a missing required title returns 400
func (suite *ControllerTestSuite) TestCreateNoteValidationError() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"content":"# No title here"}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateNote(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestCreateNoteInsertError tests that a database failure while inserting returns 500
func (suite *ControllerTestSuite) TestCreateNoteInsertError() {
	suite.mockNotePeer.EXPECT().
		Insert(mock.Anything).
		Return(int64(0), fmt.Errorf("insert failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"title":"Grammar Rules"}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestCreateNoteSelectError tests that a database failure while fetching the
// inserted note back returns 500
func (suite *ControllerTestSuite) TestCreateNoteSelectError() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: int64(testID)}

	suite.mockNotePeer.EXPECT().
		Insert(mock.Anything).
		Return(int64(testID), nil).Times(1)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"title":"Grammar Rules"}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateNote(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}
