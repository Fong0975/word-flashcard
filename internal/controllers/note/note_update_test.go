package note

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

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
