package word

import (
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
	"word-flashcard/utils"

	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite is a test suite for the word Controller
type ControllerTestSuite struct {
	suite.Suite
	controller              *Controller
	mockWordPeer            *mocks.MockWordPeer
	mockWordDefinitionPeer  *mocks.MockWordDefinitionsPeer
	mockWordPracticeLogPeer *mocks.MockWordPracticeLogPeer
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *ControllerTestSuite) SetupTest() {
	suite.mockWordPeer = mocks.NewMockWordPeer(suite.T())
	suite.mockWordDefinitionPeer = mocks.NewMockWordDefinitionsPeer(suite.T())
	suite.mockWordPracticeLogPeer = mocks.NewMockWordPracticeLogPeer(suite.T())

	suite.controller = New(suite.mockWordPeer, suite.mockWordDefinitionPeer, suite.mockWordPracticeLogPeer)
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
