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

// TestCreateWordDefinition tests the CreateWordDefinition handler
func (suite *ControllerTestSuite) TestCreateWordDefinition() {
	testDefinitionID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: 1}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{1}}

	// Mock wordPeer & wordDefinitionPeer methods as needed
	suite.mockWordDefinitionPeer.EXPECT().
		Insert(mock.MatchedBy(func(definition *dbModels.WordDefinition) bool {
			isWordID := definition.WordId != nil && *definition.WordId == 1
			isPartOfSpeech := definition.PartOfSpeech != nil && *definition.PartOfSpeech == "noun"
			isDefinition := definition.Definition != nil && *definition.Definition == "蘋果 A fruit that is typically red, green, or yellow."
			isPhonetics := definition.Phonetics != nil && *definition.Phonetics == "{\"uk\":\"https://example.com/apple_uk.mp3\",\"us\":\"https://example.com/apple_us.mp3\"}"
			isExamples := definition.Examples != nil && *definition.Examples == "[\"I ate an apple for breakfast.我早餐吃了一個蘋果。\",\"The apple pie is delicious.蘋果派很好吃。\"]"
			isNotes := definition.Notes != nil && *definition.Notes == "##Note <br/>- This is a common fruit."

			return definition != nil && isWordID && isPartOfSpeech && isDefinition && isPhonetics && isExamples && isNotes
		})).
		Return(int64(testDefinitionID), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{getSampleWords()[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"word_id\": 1, \"part_of_speech\": \"noun\", \"definition\": \"蘋果 A fruit that is typically red, green, or yellow.\", \"phonetics\": {\"uk\": \"https://example.com/apple_uk.mp3\", \"us\": \"https://example.com/apple_us.mp3\"}, \"examples\": [\"I ate an apple for breakfast.我早餐吃了一個蘋果。\", \"The apple pie is delicious.蘋果派很好吃。\"], \"notes\": \"##Note <br/>- This is a common fruit.\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/definition/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.CreateWordDefinition(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord := getExpectedWords()[0]
	expectedWordJSON, err := json.Marshal(expectedWord)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWordJSON), w.Body.String())
}
