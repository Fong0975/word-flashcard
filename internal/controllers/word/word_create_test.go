package word

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestCreateWord tests the CreateWord handler
func (suite *ControllerTestSuite) TestCreateWord() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: int64(testWordID)}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}

	// Mock wordPeer & wordDefinitionPeer methods as needed
	suite.mockWordPeer.EXPECT().
		Insert(mock.MatchedBy(func(word *dbModels.Word) bool {
			return word != nil &&
				word.Word != nil &&
				*word.Word == "apple" &&
				word.Familiarity == nil
		})).
		Return(int64(testWordID), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{getSampleWords()[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"word\": \"apple\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord := getExpectedWords()[0]
	expectedWord.Definitions = []models.WordDefinition{}
	expectedWordJSON, err := json.Marshal(expectedWord)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWordJSON), w.Body.String())
}
