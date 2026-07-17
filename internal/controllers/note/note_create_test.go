package note

import (
	"bytes"
	"encoding/json"
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
