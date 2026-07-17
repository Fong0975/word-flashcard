package word

import (
	dbModels "word-flashcard/data/models"
)

// TestTransformToWordEntities tests the transformToWordEntities function
func (suite *HelperTestSuite) TestTransformToWordEntities() {
	type testCase struct {
		name      string
		words     []*dbModels.Word
		defs      []*dbModels.WordDefinition
		wantCount int
		wantDef0  int // number of definitions for first word
	}

	id1, id2 := 1, 2
	word1, word2 := "apple", "banana"
	defText1, defText2 := "a fruit", "yellow fruit"

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
			result := suite.controller.transformToWordEntities(tc.words, tc.defs)

			suite.Len(result, tc.wantCount)
			if tc.wantCount > 0 {
				suite.Len(result[0].Definitions, tc.wantDef0)
			}
		})
	}
}
