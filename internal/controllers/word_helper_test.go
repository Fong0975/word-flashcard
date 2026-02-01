package controllers

import (
	"strings"
	"testing"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/suite"
)

// WordHelperTestSuite is a test suite for Word helper functions
type WordHelperTestSuite struct {
	suite.Suite
}

// TestWordHelperTestSuite runs the WordHelperTestSuite
func TestWordHelperTestSuite(t *testing.T) {
	suite.Run(t, new(WordHelperTestSuite))
}

// TestConvertToEntities tests the convertToEntities function
func (suite *WordHelperTestSuite) TestConvertToEntities() {
	type testCase struct {
		name      string
		words     []*dbModels.Word
		defs      []*dbModels.WordDefinition
		wantCount int
		wantDef0  int // number of definitions for first word
	}

	id1 := 1
	id2 := 2
	word1 := "apple"
	word2 := "banana"
	defText1 := "a fruit"
	defText2 := "yellow fruit"

	testCases := []testCase{
		{
			name: "two words with matching definitions",
			words: []*dbModels.Word{
				{Id: &id1, Word: &word1},
				{Id: &id2, Word: &word2},
			},
			defs: []*dbModels.WordDefinition{
				{WordId: &id1, Definition: &defText1},
				{WordId: &id2, Definition: &defText2},
			},
			wantCount: 2,
			wantDef0:  1,
		},
		{
			name: "one word with two definitions",
			words: []*dbModels.Word{
				{Id: &id1, Word: &word1},
			},
			defs: []*dbModels.WordDefinition{
				{WordId: &id1, Definition: &defText1},
				{WordId: &id1, Definition: &defText2},
			},
			wantCount: 1,
			wantDef0:  2,
		},
		{
			name: "word with no matching definitions",
			words: []*dbModels.Word{
				{Id: &id1, Word: &word1},
			},
			defs: []*dbModels.WordDefinition{
				{WordId: &id2, Definition: &defText2},
			},
			wantCount: 1,
			wantDef0:  0,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			result := convertToEntities(tc.words, tc.defs)

			suite.Len(result, tc.wantCount)
			if tc.wantCount > 0 {
				suite.Len(result[0].Definitions, tc.wantDef0)
			}
		})
	}
}

// TestValidateWordFields tests the validateWordFields function
func (suite *WordHelperTestSuite) TestValidateWordFields() {
	type testCase struct {
		name     string
		input    *models.Word
		isUpdate bool
		wantErr  bool
	}

	validWord := "example"
	longWord := strings.Repeat("a", 256)
	validFam := schema.WORD_FAMILIARITY_GREEN
	invalidFam := "blue"

	testCases := []testCase{
		{
			name: "create - valid word and familiarity",
			input: &models.Word{
				Word:        &validWord,
				Familiarity: &validFam,
			},
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - missing word",
			input: &models.Word{
				Familiarity: &validFam,
			},
			isUpdate: false,
			wantErr:  true,
		},
		{
			name: "update - invalid familiarity",
			input: &models.Word{
				Word:        &validWord,
				Familiarity: &invalidFam,
			},
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "create - word too long",
			input: &models.Word{
				Word: &longWord,
			},
			isUpdate: false,
			wantErr:  true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordFields(tc.input, tc.isUpdate)
			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateWordDefinitionFields tests the validateWordDefinitionFields function
func (suite *WordHelperTestSuite) TestValidateWordDefinitionFields() {
	type testCase struct {
		name     string
		input    models.WordDefinition
		isUpdate bool
		wantErr  bool
	}

	validPOS := "noun"
	validDef := "a short definition"
	longPOS := strings.Repeat("a", 51)
	longText := strings.Repeat("b", 21846)

	testCases := []testCase{
		{
			name: "create - valid fields",
			input: models.WordDefinition{
				PartOfSpeech: &validPOS,
				Definition:   &validDef,
			},
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - missing part_of_speech",
			input: models.WordDefinition{
				Definition: &validDef,
			},
			isUpdate: false,
			wantErr:  true,
		},
		{
			name: "update - too long part_of_speech",
			input: models.WordDefinition{
				PartOfSpeech: &longPOS,
				Definition:   &validDef,
			},
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "create - too long definition",
			input: models.WordDefinition{
				PartOfSpeech: &validPOS,
				Definition:   &longText,
			},
			isUpdate: false,
			wantErr:  true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordDefinitionFields(tc.input, tc.isUpdate)
			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
			}
		})
	}
}
