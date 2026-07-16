package word

import (
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/mock"
)

// TestParseSearchConditionsByTable tests the parseSearchConditionsByTable function
func (suite *HelperTestSuite) TestParseSearchConditionsByTable() {
	type testCase struct {
		name            string
		input           *models.SearchFilter
		wantWordsFilter bool
		wantDefsFilter  bool
		wantErr         bool
	}

	testCases := []testCase{
		{
			name: "conditions for both tables",
			input: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_FAMILIARITY, Operator: "eq", Value: "green"},
					{Key: schema.WORD_DEFINITIONS_DEFINITION, Operator: "like", Value: "%fruit%"},
				},
				Logic: "AND",
			},
			wantWordsFilter: true,
			wantDefsFilter:  true,
			wantErr:         false,
		},
		{
			name: "conditions only for words table",
			input: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_WORD, Operator: "eq", Value: "apple"},
				},
				Logic: "AND",
			},
			wantWordsFilter: true,
			wantDefsFilter:  false,
			wantErr:         false,
		},
		{
			name: "unknown column",
			input: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: "unknown_column", Operator: "eq", Value: "value"},
				},
				Logic: "AND",
			},
			wantWordsFilter: false,
			wantDefsFilter:  false,
			wantErr:         true,
		},
		{
			name:            "empty filter",
			input:           &models.SearchFilter{},
			wantWordsFilter: false,
			wantDefsFilter:  false,
			wantErr:         false,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			wordsFilter, defsFilter, err := parseSearchConditionsByTable(tc.input)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantWordsFilter, wordsFilter != nil)
				suite.Equal(tc.wantDefsFilter, defsFilter != nil)
			}
		})
	}
}

// TestExecuteComplexWordSearch tests the executeComplexWordSearch function
func (suite *HelperTestSuite) TestExecuteComplexWordSearch() {
	type testCase struct {
		name      string
		filter    *models.SearchFilter
		setupMock func()
		wantCount int
		wantErr   bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name: "search with AND logic",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_FAMILIARITY, Operator: "eq", Value: "green"},
					{Key: schema.WORD_DEFINITIONS_DEFINITION, Operator: "like", Value: "%fruit%"},
				},
				Logic: "AND",
			},
			setupMock: func() {
				// First call for words table
				suite.mockWordPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleWords, nil).Times(1)

				// Second call for word_definitions table
				suite.mockWordDefinitionPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2, // intersection of [1,2] and [1,2]
			wantErr:   false,
		},
		{
			name: "search with OR logic",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_WORD, Operator: "eq", Value: "apple"},
				},
				Logic: "OR",
			},
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return([]*dbModels.Word{sampleWords[0]}, nil).Times(1)
			},
			wantCount: 1,
			wantErr:   false,
		},
		{
			name: "search with database error",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_FAMILIARITY, Operator: "eq", Value: "green"},
				},
				Logic: "AND",
			},
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(nil, suite.createTestError()).Times(1)
			},
			wantCount: 0,
			wantErr:   true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.executeComplexWordSearch(tc.filter)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Len(result, tc.wantCount)
			}
		})
	}
}

// TestCountWordsMatchingFilter tests the countWordsMatchingFilter function
func (suite *HelperTestSuite) TestCountWordsMatchingFilter() {
	type testCase struct {
		name      string
		filter    *models.SearchFilter
		setupMock func()
		wantCount int64
		wantErr   bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name:   "empty filter - count all",
			filter: &models.SearchFilter{},
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Count(nil).
					Return(int64(5), nil).Times(1)
			},
			wantCount: 5,
			wantErr:   false,
		},
		{
			name: "filter with conditions",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_FAMILIARITY, Operator: "eq", Value: "green"},
					{Key: schema.WORD_DEFINITIONS_DEFINITION, Operator: "like", Value: "%fruit%"},
				},
				Logic: "AND",
			},
			setupMock: func() {
				// First call for words table
				suite.mockWordPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleWords, nil).Times(1)

				// Second call for word_definitions table
				suite.mockWordDefinitionPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:   "count error",
			filter: &models.SearchFilter{},
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Count(nil).
					Return(int64(0), suite.createTestError()).Times(1)
			},
			wantCount: 0,
			wantErr:   true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.countWordsMatchingFilter(tc.filter)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantCount, result)
			}
		})
	}
}

// TestCombineWordIDsWithLogic tests the combineWordIDsWithLogic function
func (suite *HelperTestSuite) TestCombineWordIDsWithLogic() {
	type testCase struct {
		name        string
		wordsIDs    []int
		wordDefsIDs []int
		logic       string
		want        []int
	}

	testCases := []testCase{
		{
			name:        "AND logic - intersection",
			wordsIDs:    []int{1, 2, 3},
			wordDefsIDs: []int{2, 3, 4},
			logic:       "AND",
			want:        []int{2, 3},
		},
		{
			name:        "OR logic - union",
			wordsIDs:    []int{1, 2},
			wordDefsIDs: []int{3, 4},
			logic:       "OR",
			want:        []int{1, 2, 3, 4},
		},
		{
			name:        "empty words IDs",
			wordsIDs:    []int{},
			wordDefsIDs: []int{1, 2},
			logic:       "AND",
			want:        []int{1, 2},
		},
		{
			name:        "empty word definitions IDs",
			wordsIDs:    []int{1, 2},
			wordDefsIDs: []int{},
			logic:       "OR",
			want:        []int{1, 2},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			result := suite.controller.combineWordIDsWithLogic(tc.wordsIDs, tc.wordDefsIDs, tc.logic)
			suite.ElementsMatch(tc.want, result)
		})
	}
}

// TestIntersectIDLists tests the intersectIDLists function
func (suite *HelperTestSuite) TestIntersectIDLists() {
	type testCase struct {
		name   string
		slice1 []int
		slice2 []int
		want   []int
	}

	testCases := []testCase{
		{
			name:   "common elements",
			slice1: []int{1, 2, 3, 4},
			slice2: []int{3, 4, 5, 6},
			want:   []int{3, 4},
		},
		{
			name:   "no common elements",
			slice1: []int{1, 2},
			slice2: []int{3, 4},
			want:   []int{},
		},
		{
			name:   "identical slices",
			slice1: []int{1, 2, 3},
			slice2: []int{1, 2, 3},
			want:   []int{1, 2, 3},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			result := suite.controller.intersectIDLists(tc.slice1, tc.slice2)
			suite.ElementsMatch(tc.want, result)
		})
	}
}

// TestUnionIDLists tests the unionIDLists function
func (suite *HelperTestSuite) TestUnionIDLists() {
	type testCase struct {
		name   string
		slice1 []int
		slice2 []int
		want   []int
	}

	testCases := []testCase{
		{
			name:   "different elements",
			slice1: []int{1, 2},
			slice2: []int{3, 4},
			want:   []int{1, 2, 3, 4},
		},
		{
			name:   "overlapping elements",
			slice1: []int{1, 2, 3},
			slice2: []int{3, 4, 5},
			want:   []int{1, 2, 3, 4, 5},
		},
		{
			name:   "identical slices",
			slice1: []int{1, 2, 3},
			slice2: []int{1, 2, 3},
			want:   []int{1, 2, 3},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			result := suite.controller.unionIDLists(tc.slice1, tc.slice2)
			suite.ElementsMatch(tc.want, result)
		})
	}
}
