package controllers

import (
	"bytes"
	"errors"
	"io"
	"net/http/httptest"
	"strings"
	"testing"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

// WordHelperTestSuite is a test suite for Word helper functions
type WordHelperTestSuite struct {
	suite.Suite
	wc                     *WordController
	mockWordPeer           *mocks.MockWordPeer
	mockWordDefinitionPeer *mocks.MockWordDefinitionsPeer
}

// TestWordHelperTestSuite runs the WordHelperTestSuite
func TestWordHelperTestSuite(t *testing.T) {
	suite.Run(t, new(WordHelperTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *WordHelperTestSuite) SetupTest() {
	suite.mockWordPeer = mocks.NewMockWordPeer(suite.T())
	suite.mockWordDefinitionPeer = mocks.NewMockWordDefinitionsPeer(suite.T())
	suite.wc = NewWordController(suite.mockWordPeer, suite.mockWordDefinitionPeer)
}

// ====================================================================================
// REQUEST PROCESSING GROUP TESTS - Handle HTTP request parsing and validation
// ====================================================================================

// TestParseAndValidateWordRequest tests the parseAndValidateWordRequest function
func (suite *WordHelperTestSuite) TestParseAndValidateWordRequest() {
	type testCase struct {
		name        string
		requestBody string
		isUpdate    bool
		wantErr     bool
	}

	testCases := []testCase{
		{
			name:        "create - valid word data",
			requestBody: `{"word": "apple", "familiarity": "green"}`,
			isUpdate:    false,
			wantErr:     false,
		},
		{
			name:        "create - missing required word",
			requestBody: `{"familiarity": "green"}`,
			isUpdate:    false,
			wantErr:     true,
		},
		{
			name:        "update - valid data",
			requestBody: `{"familiarity": "yellow"}`,
			isUpdate:    true,
			wantErr:     false,
		},
		{
			name:        "invalid json format",
			requestBody: `{"word": "apple"`,
			isUpdate:    false,
			wantErr:     true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := suite.createGinContext(tc.requestBody)

			result, err := suite.wc.parseAndValidateWordRequest(ctx, tc.isUpdate)

			if tc.wantErr {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				suite.NotNil(result)
			}
		})
	}
}

// TestParseAndValidateWordDefinitionRequest tests the parseAndValidateWordDefinitionRequest function
func (suite *WordHelperTestSuite) TestParseAndValidateWordDefinitionRequest() {
	type testCase struct {
		name        string
		requestBody string
		isUpdate    bool
		wantErr     bool
	}

	testCases := []testCase{
		{
			name:        "create - valid definition data",
			requestBody: `{"part_of_speech": "noun", "definition": "a fruit"}`,
			isUpdate:    false,
			wantErr:     false,
		},
		{
			name:        "create - missing required part_of_speech",
			requestBody: `{"definition": "a fruit"}`,
			isUpdate:    false,
			wantErr:     true,
		},
		{
			name:        "update - valid data",
			requestBody: `{"definition": "updated definition"}`,
			isUpdate:    true,
			wantErr:     false,
		},
		{
			name:        "invalid json format",
			requestBody: `{"part_of_speech": "noun"`,
			isUpdate:    false,
			wantErr:     true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := suite.createGinContext(tc.requestBody)

			result, err := suite.wc.parseAndValidateWordDefinitionRequest(ctx, tc.isUpdate)

			if tc.wantErr {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				suite.NotNil(result)
			}
		})
	}
}

// ====================================================================================
// DATA QUERY GROUP TESTS - Handle database queries and data fetching
// ====================================================================================

// TestFetchWordsWithDefinitions tests the fetchWordsWithDefinitions function
func (suite *WordHelperTestSuite) TestFetchWordsWithDefinitions() {
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

			result, err := suite.wc.fetchWordsWithDefinitions(nil, nil, nil, nil, nil)

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
func (suite *WordHelperTestSuite) TestFetchWordDefinitionsForWords() {
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
			name:      "empty words input",
			words:     []*dbModels.Word{},
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

			result, err := suite.wc.fetchWordDefinitionsForWords(tc.words)

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
func (suite *WordHelperTestSuite) TestQueryWordsByIDsWithPagination() {
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

			result, err := suite.wc.queryWordsByIDsWithPagination(tc.wordIDs, nil, nil, nil)

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
func (suite *WordHelperTestSuite) TestQueryWordIDsByTableFilter() {
	type testCase struct {
		name                     string
		filter                   *models.SearchFilter
		isWordDefinitionsTable   bool
		setupMock               func()
		wantCount               int
		wantErr                 bool
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

			result, err := suite.wc.queryWordIDsByTableFilter(tc.filter, tc.isWordDefinitionsTable)

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

// ====================================================================================
// SEARCH OPERATIONS GROUP TESTS - Handle complex search and filtering operations
// ====================================================================================

// TestParseSearchConditionsByTable tests the parseSearchConditionsByTable function
func (suite *WordHelperTestSuite) TestParseSearchConditionsByTable() {
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
func (suite *WordHelperTestSuite) TestExecuteComplexWordSearch() {
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

			result, err := suite.wc.executeComplexWordSearch(tc.filter)

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
func (suite *WordHelperTestSuite) TestCountWordsMatchingFilter() {
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

			result, err := suite.wc.countWordsMatchingFilter(tc.filter)

			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
				suite.Equal(tc.wantCount, result)
			}
		})
	}
}

// ====================================================================================
// DATA TRANSFORMATION GROUP TESTS - Handle model conversions and data mapping
// ====================================================================================

// TestTransformToWordEntities tests the transformToWordEntities function
func (suite *WordHelperTestSuite) TestTransformToWordEntities() {
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
			result := suite.wc.transformToWordEntities(tc.words, tc.defs)

			suite.Len(result, tc.wantCount)
			if tc.wantCount > 0 {
				suite.Len(result[0].Definitions, tc.wantDef0)
			}
		})
	}
}

// ====================================================================================
// VALIDATION GROUP TESTS - Handle field validation and data integrity
// ====================================================================================

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

// ====================================================================================
// UTILITY OPERATIONS GROUP TESTS - Handle data processing utilities and helper algorithms
// ====================================================================================

// TestCombineWordIDsWithLogic tests the combineWordIDsWithLogic function
func (suite *WordHelperTestSuite) TestCombineWordIDsWithLogic() {
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
			result := suite.wc.combineWordIDsWithLogic(tc.wordsIDs, tc.wordDefsIDs, tc.logic)
			suite.ElementsMatch(tc.want, result)
		})
	}
}

// TestIntersectIDLists tests the intersectIDLists function
func (suite *WordHelperTestSuite) TestIntersectIDLists() {
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
			result := suite.wc.intersectIDLists(tc.slice1, tc.slice2)
			suite.ElementsMatch(tc.want, result)
		})
	}
}

// TestUnionIDLists tests the unionIDLists function
func (suite *WordHelperTestSuite) TestUnionIDLists() {
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
			result := suite.wc.unionIDLists(tc.slice1, tc.slice2)
			suite.ElementsMatch(tc.want, result)
		})
	}
}

// ====================================================================================
// PRIVATE HELPER FUNCTIONS - Shared utilities for tests
// ====================================================================================

// createGinContext creates a gin context with request body for testing
func (suite *WordHelperTestSuite) createGinContext(requestBody string) *gin.Context {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest("POST", "/test", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Request.Header.Set("Content-Type", "application/json")
	return ctx
}

// createTestError creates a test error for mock expectations
func (suite *WordHelperTestSuite) createTestError() error {
	return errors.New("test error")
}

// getSampleWords returns sample words for testing
func (suite *WordHelperTestSuite) getSampleWords() []*dbModels.Word {
	id1, id2 := 1, 2
	word1, word2 := "apple", "banana"
	fam1, fam2 := "green", "yellow"

	return []*dbModels.Word{
		{Id: &id1, Word: &word1, Familiarity: &fam1},
		{Id: &id2, Word: &word2, Familiarity: &fam2},
	}
}

// getSampleWordDefinitions returns sample word definitions for testing
func (suite *WordHelperTestSuite) getSampleWordDefinitions() []*dbModels.WordDefinition {
	id1, id2 := 1, 2
	wordId1, wordId2 := 1, 2
	pos := "noun"
	def1, def2 := "a fruit", "yellow fruit"

	return []*dbModels.WordDefinition{
		{Id: &id1, WordId: &wordId1, PartOfSpeech: &pos, Definition: &def1},
		{Id: &id2, WordId: &wordId2, PartOfSpeech: &pos, Definition: &def2},
	}
}
