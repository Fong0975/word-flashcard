package word

import (
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// TestFetchWordsWithDefinitions tests the fetchWordsWithDefinitions function
func (suite *HelperTestSuite) TestFetchWordsWithDefinitions() {
	type testCase struct {
		name      string
		setupMock func()
		wantCount int
		wantErr   bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name: "successful fetch with definitions",
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(sampleWords, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().
					Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name: "word peer error",
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, suite.createTestError()).Times(1)
			},
			wantCount: 0,
			wantErr:   true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.fetchWordsWithDefinitions(nil, nil, nil, nil, nil)

			if tc.wantErr {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				suite.Len(result, tc.wantCount)
			}
		})
	}
}

// TestFetchWordDefinitionsForWords tests the fetchWordDefinitionsForWords function
func (suite *HelperTestSuite) TestFetchWordDefinitionsForWords() {
	type testCase struct {
		name      string
		words     []*dbModels.Word
		setupMock func()
		wantCount int
		wantErr   bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name:  "successful fetch definitions",
			words: sampleWords,
			setupMock: func() {
				expectedWhere := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{1, 2}}
				suite.mockWordDefinitionPeer.EXPECT().
					Select([]*string{}, expectedWhere, mock.Anything, (*uint64)(nil), (*uint64)(nil)).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:  "empty words input",
			words: []*dbModels.Word{},
			setupMock: func() {
				// For empty words, wordIDs will be nil slice, not empty slice
				var nilSlice []int
				expectedWhere := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: nilSlice}
				suite.mockWordDefinitionPeer.EXPECT().
					Select([]*string{}, expectedWhere, mock.Anything, (*uint64)(nil), (*uint64)(nil)).
					Return([]*dbModels.WordDefinition{}, nil).Times(1)
			},
			wantCount: 0,
			wantErr:   false,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.fetchWordDefinitionsForWords(tc.words)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Len(result, tc.wantCount)
			}
		})
	}
}

// TestQueryWordsByIDsWithPagination tests the queryWordsByIDsWithPagination function
func (suite *HelperTestSuite) TestQueryWordsByIDsWithPagination() {
	type testCase struct {
		name      string
		wordIDs   []int
		setupMock func()
		wantCount int
		wantErr   bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name:    "successful query with pagination",
			wordIDs: []int{1, 2},
			setupMock: func() {
				expectedWhere := squirrel.Eq{schema.WORD_ID: []int{1, 2}}
				suite.mockWordPeer.EXPECT().
					Select([]*string{}, expectedWhere, mock.Anything, mock.Anything, mock.Anything).
					Return(sampleWords, nil).Times(1)
				suite.mockWordDefinitionPeer.EXPECT().
					Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:      "empty word IDs",
			wordIDs:   []int{},
			setupMock: func() {},
			wantCount: 0,
			wantErr:   false,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.queryWordsByIDsWithPagination(tc.wordIDs, nil, nil, nil)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Len(result, tc.wantCount)
			}
		})
	}
}

// TestQueryWordIDsByTableFilter tests the queryWordIDsByTableFilter function
func (suite *HelperTestSuite) TestQueryWordIDsByTableFilter() {
	type testCase struct {
		name                   string
		filter                 *models.SearchFilter
		isWordDefinitionsTable bool
		setupMock              func()
		wantCount              int
		wantErr                bool
	}

	sampleWords := suite.getSampleWords()
	sampleDefs := suite.getSampleWordDefinitions()

	testCases := []testCase{
		{
			name: "query words table",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_FAMILIARITY, Operator: "eq", Value: "green"},
				},
				Logic: "AND",
			},
			isWordDefinitionsTable: false,
			setupMock: func() {
				suite.mockWordPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleWords, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name: "query word_definitions table",
			filter: &models.SearchFilter{
				Conditions: []models.SearchCondition{
					{Key: schema.WORD_DEFINITIONS_DEFINITION, Operator: "like", Value: "%fruit%"},
				},
				Logic: "AND",
			},
			isWordDefinitionsTable: true,
			setupMock: func() {
				suite.mockWordDefinitionPeer.EXPECT().
					Select(([]*string)(nil), mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
					Return(sampleDefs, nil).Times(1)
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:                   "nil filter",
			filter:                 nil,
			isWordDefinitionsTable: false,
			setupMock:              func() {},
			wantCount:              0,
			wantErr:                false,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			result, err := suite.controller.queryWordIDsByTableFilter(tc.filter, tc.isWordDefinitionsTable)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				if tc.filter != nil {
					suite.Len(result, tc.wantCount)
				} else {
					suite.Nil(result)
				}
			}
		})
	}
}
