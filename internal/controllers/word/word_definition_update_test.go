package word

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

// TestUpdateWordDefinition tests the UpdateWordDefinition handler
func (suite *ControllerTestSuite) TestUpdateWordDefinition() {
	testDefinitionID := 1
	testWordID := 1
	whereDefinition := squirrel.Eq{schema.WORD_DEFINITIONS_ID: testDefinitionID}
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionsByWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}

	// Definition as it exists after the update has been applied.
	updatedDefinition := getSampleWordDefinitions()[0]
	updatedText := "蘋果 An updated definition for testing purposes."
	updatedDefinition.Definition = &updatedText

	// Update: verify part_of_speech, definition, phonetics, examples, and notes are updated, and ID is not overwritten.
	suite.mockWordDefinitionPeer.EXPECT().
		Update(mock.MatchedBy(func(definition *dbModels.WordDefinition) bool {
			isPartOfSpeech := definition.PartOfSpeech != nil && *definition.PartOfSpeech == "noun"
			isDefinition := definition.Definition != nil && *definition.Definition == updatedText
			isPhonetics := definition.Phonetics != nil && *definition.Phonetics == "{\"uk\":\"https://example.com/apple_uk.mp3\",\"us\":\"https://example.com/apple_us.mp3\"}"
			isExamples := definition.Examples != nil && *definition.Examples == "[\"I ate an apple for breakfast.我早餐吃了一個蘋果。\",\"The apple pie is delicious.蘋果派很好吃。\"]"
			isNotes := definition.Notes != nil && *definition.Notes == "##Note <br/>- This is a common fruit."

			return definition != nil && definition.Id == nil && isPartOfSpeech && isDefinition && isPhonetics && isExamples && isNotes
		}), whereDefinition).
		Return(int64(1), nil).Times(1)

	// Select updated word definition to get the associated word ID
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinition, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{updatedDefinition}, nil).Times(1)

	// Select the associated word and its definitions for the response
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{getSampleWords()[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionsByWordID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{updatedDefinition}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"part_of_speech\": \"noun\", \"definition\": \"蘋果 An updated definition for testing purposes.\", \"phonetics\": {\"uk\": \"https://example.com/apple_uk.mp3\", \"us\": \"https://example.com/apple_us.mp3\"}, \"examples\": [\"I ate an apple for breakfast.我早餐吃了一個蘋果。\", \"The apple pie is delicious.蘋果派很好吃。\"], \"notes\": \"##Note <br/>- This is a common fruit.\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/definition/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWordDefinition(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord := getExpectedWords()[0]
	expectedWord.Definitions[0].Definition = &updatedText
	expectedWordJSON, err := json.Marshal(expectedWord)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWordJSON), w.Body.String())
}

// TestUpdateWordDefinitionNotFound tests that updating a non-existent word definition returns 404
func (suite *ControllerTestSuite) TestUpdateWordDefinitionNotFound() {
	whereDefinition := squirrel.Eq{schema.WORD_DEFINITIONS_ID: 999}

	suite.mockWordDefinitionPeer.EXPECT().
		Update(mock.Anything, whereDefinition).
		Return(int64(0), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"part_of_speech\": \"noun\", \"definition\": \"蘋果 A fruit.\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/definition/999", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}
	suite.controller.UpdateWordDefinition(ctx)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestUpdateWordDefinitionInvalidID tests that an invalid word definition ID returns 400
func (suite *ControllerTestSuite) TestUpdateWordDefinitionInvalidID() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"part_of_speech\": \"noun\", \"definition\": \"蘋果 A fruit.\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/definition/abc", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "abc"}}
	suite.controller.UpdateWordDefinition(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}
