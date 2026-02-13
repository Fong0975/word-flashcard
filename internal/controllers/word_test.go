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
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

// WordControllerTestSuite is a test suite for Word controller functions
type WordControllerTestSuite struct {
	suite.Suite
	wc                     *WordController
	mockWordPeer           *mocks.MockWordPeer
	mockWordDefinitionPeer *mocks.MockWordDefinitionsPeer
}

// TestWordControllerTestSuite runs the WordControllerTestSuite
func TestWordControllerTestSuite(t *testing.T) {
	suite.Run(t, new(WordControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *WordControllerTestSuite) SetupTest() {
	suite.mockWordPeer = mocks.NewMockWordPeer(suite.T())
	suite.mockWordDefinitionPeer = mocks.NewMockWordDefinitionsPeer(suite.T())

	suite.wc = NewWordController(suite.mockWordPeer, suite.mockWordDefinitionPeer)
}

// TestListWords tests the ListWords handler
func (suite *WordControllerTestSuite) TestListWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleWords(), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWordDefinitions(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words", nil)
	suite.wc.ListWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord, err := json.Marshal(getExpectedWords())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestSearchWords tests the SearchWords handler
func (suite *WordControllerTestSuite) TestSearchWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	whereWord := squirrel.Eq{schema.WORD_WORD: "apple"}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{1}}

	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, &limitPtr, &offsetPtr).
		Return([]*dbModels.Word{getSampleWords()[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"key\": \"word\", \"operator\": \"eq\", \"value\": \"apple\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.wc.SearchWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord, err := json.Marshal([]*models.Word{getExpectedWords()[0]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestRandomWords tests the RandomWords handler
func (suite *WordControllerTestSuite) TestRandomWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{2, 4}}

	limitPtr := uint64(2)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.MatchedBy(func(orderBy []*string) bool {
			b := len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
			return b
		}), &limitPtr, (*uint64)(nil)).
		Return([]*dbModels.Word{getSampleWords()[1], getSampleWords()[3]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[1], getSampleWordDefinitions()[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"count\": 2, \"filter\": {\"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"yellow\"}}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/random", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.wc.RandomWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWords, err := json.Marshal([]*models.Word{getExpectedWords()[1], getExpectedWords()[3]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWords), w.Body.String())
}

// TestCreateWord tests the CreateWord handler
func (suite *WordControllerTestSuite) TestCreateWord() {
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
	suite.wc.CreateWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord := getExpectedWords()[0]
	expectedWord.Definitions = []models.WordDefinition{}
	expectedWordJSON, err := json.Marshal(expectedWord)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWordJSON), w.Body.String())
}

// TestCreateWordDefinition tests the CreateWordDefinition handler
func (suite *WordControllerTestSuite) TestCreateWordDefinition() {
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
	suite.wc.CreateWordDefinition(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWord := getExpectedWords()[0]
	expectedWordJSON, err := json.Marshal(expectedWord)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWordJSON), w.Body.String())
}

// TestUpdateWord tests the UpdateWord handler
func (suite *WordControllerTestSuite) TestUpdateWord() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}
	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")

	// Mock wordPeer & wordDefinitionPeer methods as needed
	suite.mockWordPeer.EXPECT().
		Update(mock.MatchedBy(func(word *dbModels.Word) bool {
			isFamiliarity := word.Familiarity != nil && *word.Familiarity == "yellow"
			return word != nil && word.Id == nil && isFamiliarity
		}), whereWord).
		Return(int64(1), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"familiarity\": \"yellow\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.wc.UpdateWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWordObj := getExpectedWords()[0]
	expectedWordObj.Familiarity = utils.StrPtr("yellow")
	expectedWord, err := json.Marshal(expectedWordObj)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestDeleteWord tests the DeleteWord handler
func (suite *WordControllerTestSuite) TestDeleteWord() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: testWordID}

	// Mock wordPeer & wordDefinitionPeer methods as needed
	suite.mockWordPeer.EXPECT().
		Delete(whereWord).
		Return(int64(1), nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(2), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.wc.DeleteWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}

// TestDeleteWordDefinition tests the DeleteWordDefinition handler
func (suite *WordControllerTestSuite) TestDeleteWordDefinition() {
	testDefinitionID := 1
	whereWordID := squirrel.Eq{schema.WORD_DEFINITIONS_ID: testDefinitionID}

	// Mock wordDefinitionPeer methods as needed
	suite.mockWordDefinitionPeer.EXPECT().
		Delete(whereWordID).
		Return(int64(1), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/words/definition/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.wc.DeleteWordDefinition(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}

// getSampleWords return sample word for testing
func getSampleWords() []*dbModels.Word {
	modifyTime := time.Now()

	testData := []struct {
		id          int
		word        string
		familiarity string
	}{
		{1, "apple", "green"},
		{2, "banana", "yellow"},
		{3, "cherry", "red"},
		{4, "lemon", "yellow"},
		{5, "corn", "yellow"},
	}

	words := make([]*dbModels.Word, 0, len(testData))
	for _, data := range testData {
		words = append(words, &dbModels.Word{
			Id:          &data.id,
			Word:        &data.word,
			Familiarity: &data.familiarity,
			CreatedAt:   &modifyTime,
			UpdatedAt:   &modifyTime,
		})
	}

	return words
}

// getSampleWordDefinitions returns sample word definitions for testing
func getSampleWordDefinitions() []*dbModels.WordDefinition {
	modifyTime := time.Now()

	testData := []struct {
		id           int
		wordId       int
		partOfSpeech string
		definition   string
		phonetics    string
		example      string
		note         string
	}{
		{
			1,
			1,
			"noun",
			"蘋果 A fruit that is typically red, green, or yellow.",
			"{\"uk\":\"https://example.com/apple_uk.mp3\",\"us\":\"https://example.com/apple_us.mp3\"}",
			"[\"I ate an apple for breakfast.我早餐吃了一個蘋果。\", \"The apple pie is delicious.蘋果派很好吃。\"]",
			"##Note <br/>- This is a common fruit.",
		},
		{
			2,
			2,
			"noun",
			"香蕉 A long curved fruit that grows in clusters and has soft pulpy flesh and yellow skin when ripe.",
			"",
			"",
			"",
		},
		{
			3,
			3,
			"noun",
			"櫻桃 A small, round fruit that is typically bright or dark red.",
			"",
			"[\"She picked cherries from the tree.她從樹上摘櫻桃。\"]",
			"",
		},
		{
			4,
			4,
			"noun",
			"檸檬 A yellow citrus fruit with acidic juice.",
			"",
			"[\"Add lemon juice to the salad.在沙拉中加檸檬汁。\"]",
			"",
		},
		{
			5,
			5,
			"noun",
			"玉米 A tall cereal plant that produces kernels on large ears.",
			"",
			"[\"We grilled corn on the cob.我們烤了玉米棒。\"]",
			"",
		},
	}

	definitions := make([]*dbModels.WordDefinition, 0, len(testData))
	for _, data := range testData {
		var testPhonetics, testExamples, testNotes *string
		if data.phonetics != "" {
			testPhonetics = &data.phonetics
		} else {
			testPhonetics = nil
		}

		if data.example != "" {
			testExamples = &data.example
		} else {
			testExamples = nil
		}

		if data.note != "" {
			testNotes = &data.note
		} else {
			testNotes = nil
		}

		definitions = append(definitions, &dbModels.WordDefinition{
			Id:           &data.id,
			WordId:       &data.wordId,
			PartOfSpeech: &data.partOfSpeech,
			Definition:   &data.definition,
			Phonetics:    testPhonetics,
			Examples:     testExamples,
			Notes:        testNotes,
			CreatedAt:    &modifyTime,
			UpdatedAt:    &modifyTime,
		})
	}

	return definitions
}

// getExpectedWords returns expected word for testing
func getExpectedWords() []*models.Word {
	return []*models.Word{
		{
			ID:          utils.IntPtr(1),
			Word:        utils.StrPtr("apple"),
			Familiarity: utils.StrPtr("green"),
			Definitions: []models.WordDefinition{
				{
					ID:           utils.IntPtr(1),
					PartOfSpeech: utils.StrPtr("noun"),
					Definition:   utils.StrPtr("蘋果 A fruit that is typically red, green, or yellow."),
					Phonetics: &map[string]interface{}{
						"uk": "https://example.com/apple_uk.mp3",
						"us": "https://example.com/apple_us.mp3",
					},
					Examples: &[]string{
						"I ate an apple for breakfast.我早餐吃了一個蘋果。",
						"The apple pie is delicious.蘋果派很好吃。",
					},
					Notes: utils.StrPtr("##Note <br/>- This is a common fruit."),
				},
			},
		},
		{
			ID:          utils.IntPtr(2),
			Word:        utils.StrPtr("banana"),
			Familiarity: utils.StrPtr("yellow"),
			Definitions: []models.WordDefinition{
				{
					ID:           utils.IntPtr(2),
					PartOfSpeech: utils.StrPtr("noun"),
					Definition:   utils.StrPtr("香蕉 A long curved fruit that grows in clusters and has soft pulpy flesh and yellow skin when ripe."),
					Phonetics:    &map[string]interface{}{},
					Examples:     &[]string{},
					Notes:        utils.StrPtr(""),
				},
			},
		},
		{
			ID:          utils.IntPtr(3),
			Word:        utils.StrPtr("cherry"),
			Familiarity: utils.StrPtr("red"),
			Definitions: []models.WordDefinition{
				{
					ID:           utils.IntPtr(3),
					PartOfSpeech: utils.StrPtr("noun"),
					Definition:   utils.StrPtr("櫻桃 A small, round fruit that is typically bright or dark red."),
					Phonetics:    &map[string]interface{}{},
					Examples: &[]string{
						"She picked cherries from the tree.她從樹上摘櫻桃。",
					},
					Notes: utils.StrPtr(""),
				},
			},
		},
		{
			ID:          utils.IntPtr(4),
			Word:        utils.StrPtr("lemon"),
			Familiarity: utils.StrPtr("yellow"),
			Definitions: []models.WordDefinition{
				{
					ID:           utils.IntPtr(4),
					PartOfSpeech: utils.StrPtr("noun"),
					Definition:   utils.StrPtr("檸檬 A yellow citrus fruit with acidic juice."),
					Phonetics:    &map[string]interface{}{},
					Examples: &[]string{
						"Add lemon juice to the salad.在沙拉中加檸檬汁。",
					},
					Notes: utils.StrPtr(""),
				},
			},
		},
		{
			ID:          utils.IntPtr(5),
			Word:        utils.StrPtr("corn"),
			Familiarity: utils.StrPtr("yellow"),
			Definitions: []models.WordDefinition{
				{
					ID:           utils.IntPtr(5),
					PartOfSpeech: utils.StrPtr("noun"),
					Definition:   utils.StrPtr("玉米 A tall cereal plant that produces kernels on large ears."),
					Phonetics:    &map[string]interface{}{},
					Examples: &[]string{
						"We grilled corn on the cob.我們烤了玉米棒。",
					},
					Notes: utils.StrPtr(""),
				},
			},
		},
	}
}
