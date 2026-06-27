package controllers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

type NoteControllerTestSuite struct {
	suite.Suite
	controller   *NoteController
	mockNotePeer *mocks.MockNotePeer
}

// TestNoteControllerTestSuite runs the NoteControllerTestSuite
func TestNoteControllerTestSuite(t *testing.T) {
	suite.Run(t, new(NoteControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *NoteControllerTestSuite) SetupTest() {
	suite.mockNotePeer = mocks.NewMockNotePeer(suite.T())
	suite.controller = NewNoteController(suite.mockNotePeer)
}

// TestListNotes tests the ListNotes handler
func (suite *NoteControllerTestSuite) TestListNotes() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleNotes(), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes", nil)
	suite.controller.ListNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestSearchNotes tests the SearchNotes handler
func (suite *NoteControllerTestSuite) TestSearchNotes() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleNotes()[:1], nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"conditions":[{"key":"title","operator":"like","value":"%Grammar%"}],"logic":"AND"}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes/search", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.SearchNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes()[:1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetNote tests the GetNote handler
func (suite *NoteControllerTestSuite) TestGetNote() {
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

// TestCreateNote tests the CreateNote handler
func (suite *NoteControllerTestSuite) TestCreateNote() {
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

// TestUpdateNote tests the UpdateNote handler
func (suite *NoteControllerTestSuite) TestUpdateNote() {
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

// TestDeleteNote tests the DeleteNote handler
func (suite *NoteControllerTestSuite) TestDeleteNote() {
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

// TestCountNotes tests the CountNotes handler
func (suite *NoteControllerTestSuite) TestCountNotes() {
	suite.mockNotePeer.EXPECT().
		Count().
		Return(int64(3), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/count", nil)
	suite.controller.CountNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), `{"count":3}`, w.Body.String())
}

var testNoteModifyTime = time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

// getSampleNotes returns sample Note db models for testing
func getSampleNotes() []*dbModels.Note {
	testData := []struct {
		title     string
		content   string
		sortOrder int
	}{
		{
			title:     "Grammar Rules",
			content:   "# Grammar\n- Subject-Verb Agreement",
			sortOrder: 1,
		},
		{
			title:     "Vocabulary",
			content:   "# Vocabulary\n- Common words list",
			sortOrder: 2,
		},
		{
			title:     "Pronunciation",
			content:   "# Pronunciation\n- IPA symbols guide",
			sortOrder: 3,
		},
	}

	notes := make([]*dbModels.Note, 0, len(testData))
	for index, data := range testData {
		newID := index + 1
		notes = append(notes, &dbModels.Note{
			Id:        &newID,
			Title:     &data.title,
			Content:   &data.content,
			SortOrder: &data.sortOrder,
			CreatedAt: &testNoteModifyTime,
			UpdatedAt: &testNoteModifyTime,
		})
	}

	return notes
}

// getExpectedNotes returns expected Note API models for testing
func getExpectedNotes() []*models.Note {
	return []*models.Note{
		{
			ID:        utils.IntPtr(1),
			Title:     utils.StrPtr("Grammar Rules"),
			Content:   utils.StrPtr("# Grammar\n- Subject-Verb Agreement"),
			SortOrder: utils.IntPtr(1),
			UpdatedAt: &testNoteModifyTime,
		},
		{
			ID:        utils.IntPtr(2),
			Title:     utils.StrPtr("Vocabulary"),
			Content:   utils.StrPtr("# Vocabulary\n- Common words list"),
			SortOrder: utils.IntPtr(2),
			UpdatedAt: &testNoteModifyTime,
		},
		{
			ID:        utils.IntPtr(3),
			Title:     utils.StrPtr("Pronunciation"),
			Content:   utils.StrPtr("# Pronunciation\n- IPA symbols guide"),
			SortOrder: utils.IntPtr(3),
			UpdatedAt: &testNoteModifyTime,
		},
	}
}
