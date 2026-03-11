package controllers

import (
	"encoding/json"
	"strings"
	"testing"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

// QuestionHelperTestSuite is a test suite for Question helper functions
type QuestionHelperTestSuite struct {
	suite.Suite
	controller *QuestionController
}

// TestQuestionHelperTestSuite runs the QuestionHelperTestSuite
func TestQuestionHelperTestSuite(t *testing.T) {
	suite.Run(t, new(QuestionHelperTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *QuestionHelperTestSuite) SetupTest() {
	mockQuestionPeer := mocks.NewMockQuestionPeer(suite.T())
	suite.controller = NewQuestionController(mockQuestionPeer)
}

// TestConvertToEntities tests the convertToEntities function
func (suite *QuestionHelperTestSuite) TestConvertToEntities() {
	// Create testing data
	dbQuestions := []*dbModels.Question{
		{
			Id:                   utils.IntPtr(1),
			Question:             utils.StrPtr("The marketing department has decided to ______ the new product launch until next month."),
			OptionA:              utils.StrPtr("postpone"),
			OptionB:              utils.StrPtr("postpone"),
			OptionC:              utils.StrPtr("postponing"),
			OptionD:              utils.StrPtr("postponement"),
			Answer:               utils.StrPtr("A"),
			Reference:            utils.StrPtr("Google Gemini Sample Q01"),
			Notes:                utils.StrPtr("- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。"),
			CountPractise:        utils.IntPtr(10),
			CountFailurePractise: utils.IntPtr(2),
		},
		{
			Id:                   utils.IntPtr(2),
			Question:             utils.StrPtr("Ms. Chen requested that the report ______ on her desk before 5:00 PM today."),
			OptionA:              utils.StrPtr("is placed"),
			OptionB:              utils.StrPtr("be placed"),
			OptionC:              utils.StrPtr("places"),
			OptionD:              utils.StrPtr("placing"),
			Answer:               utils.StrPtr("B"),
			Reference:            utils.StrPtr("Google Gemini Sample Q02"),
			Notes:                utils.StrPtr("- 要求動詞 (request/suggest) 之後的子句，動詞需用「should + 原形動詞」，should可省略，故用 `be placed`。"),
			CountPractise:        utils.IntPtr(8),
			CountFailurePractise: utils.IntPtr(0),
		},
	}

	// Poke the method
	resultQuestions := suite.controller.convertToEntities(dbQuestions)

	// Verify the result with expected data
	expectedQuestions := []*models.Question{
		{
			ID:                   utils.IntPtr(1),
			Question:             utils.StrPtr("The marketing department has decided to ______ the new product launch until next month."),
			OptionA:              utils.StrPtr("postpone"),
			OptionB:              utils.StrPtr("postpone"),
			OptionC:              utils.StrPtr("postponing"),
			OptionD:              utils.StrPtr("postponement"),
			Answer:               utils.StrPtr("A"),
			Reference:            utils.StrPtr("Google Gemini Sample Q01"),
			Notes:                utils.StrPtr("- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。"),
			CountPractise:        utils.IntPtr(10),
			CountFailurePractise: utils.IntPtr(2),
		},
		{
			ID:                   utils.IntPtr(2),
			Question:             utils.StrPtr("Ms. Chen requested that the report ______ on her desk before 5:00 PM today."),
			OptionA:              utils.StrPtr("is placed"),
			OptionB:              utils.StrPtr("be placed"),
			OptionC:              utils.StrPtr("places"),
			OptionD:              utils.StrPtr("placing"),
			Answer:               utils.StrPtr("B"),
			Reference:            utils.StrPtr("Google Gemini Sample Q02"),
			Notes:                utils.StrPtr("- 要求動詞 (request/suggest) 之後的子句，動詞需用「should + 原形動詞」，should可省略，故用 `be placed`。"),
			CountPractise:        utils.IntPtr(8),
			CountFailurePractise: utils.IntPtr(0),
		},
	}
	result, err := json.Marshal(resultQuestions)
	assert.NoError(suite.T(), err)
	expected, err := json.Marshal(expectedQuestions)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expected), string(result))
}

// TestValidateQuestionFields test the validateQuestionFields function
func (suite *QuestionHelperTestSuite) TestValidateQuestionFields() {
	type questionTestCase struct {
		name     string
		input    *models.Question
		isUpdate bool
		wantErr  bool
	}

	testQuestion := models.Question{
		ID:                   utils.IntPtr(1),
		Question:             utils.StrPtr("The marketing department has decided to ______ the new product launch until next month."),
		OptionA:              utils.StrPtr("postpone"),
		OptionB:              utils.StrPtr("postpone"),
		OptionC:              utils.StrPtr("postponing"),
		OptionD:              utils.StrPtr("postponement"),
		Answer:               utils.StrPtr("A"),
		Reference:            utils.StrPtr("Google Gemini Sample Q01"),
		Notes:                utils.StrPtr("- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。"),
		CountPractise:        utils.IntPtr(10),
		CountFailurePractise: utils.IntPtr(2),
	}

	testCases := []questionTestCase{
		{
			name: "create",
			input: func() *models.Question {
				q := testQuestion
				return &q
			}(),
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - nil question",
			input: func() *models.Question {
				q := testQuestion
				q.Question = nil
				return &q
			}(),
			isUpdate: false,
			wantErr:  true,
		},
		{
			name: "update - invalid question",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 1025)
				q.Question = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "create - nil option_a",
			input: func() *models.Question {
				q := testQuestion
				q.OptionA = nil
				return &q
			}(),
			isUpdate: false,
			wantErr:  true,
		},
		{
			name: "update - invalid option_a",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionA = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid option_b",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionB = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid option_c",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionC = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid option_d",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionD = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "create - nil answer",
			input: func() *models.Question {
				q := testQuestion
				q.Answer = nil
				return &q
			}(),
			isUpdate: false,
			wantErr:  true,
		},
		{
			name: "update - invalid answer",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 6)
				q.Answer = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid answer",
			input: func() *models.Question {
				q := testQuestion
				q.Answer = utils.StrPtr("F")
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid reference",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.Reference = &invalidStr
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid count_practise",
			input: func() *models.Question {
				q := testQuestion
				q.CountPractise = utils.IntPtr(-1)
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid count_failure_practise",
			input: func() *models.Question {
				q := testQuestion
				q.CountFailurePractise = utils.IntPtr(-1)
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
		{
			name: "update - invalid count_failure_practise (lager than count_practise)",
			input: func() *models.Question {
				q := testQuestion
				q.CountPractise = utils.IntPtr(5)
				q.CountFailurePractise = utils.IntPtr(6)
				return &q
			}(),
			isUpdate: true,
			wantErr:  true,
		},
	}

	// Run the test cases and validate the result
	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := suite.controller.validateQuestionFields(tc.input, tc.isUpdate)
			if tc.wantErr {
				suite.Error(err)
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestFetchQuestionBucket tests the fetchQuestionBucket helper
func (suite *QuestionHelperTestSuite) TestFetchQuestionBucket() {
	// Setup fresh mock with Select expectation
	mockPeer := mocks.NewMockQuestionPeer(suite.T())
	controller := NewQuestionController(mockPeer)

	where := squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}
	limit := uint64(2)
	sampleQuestions := getSampleQuestions()
	mockPeer.EXPECT().
		Select(mock.Anything, where, mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		}), &limit, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[0], sampleQuestions[1]}, nil).Times(1)

	// Poke the method
	result, err := controller.fetchQuestionBucket(where, 2)

	// Verify the result
	assert.NoError(suite.T(), err)
	resultJSON, err := json.Marshal(result)
	assert.NoError(suite.T(), err)
	expectedJSON, err := json.Marshal([]*dbModels.Question{sampleQuestions[0], sampleQuestions[1]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), string(resultJSON))
}

// TestFetchRandomQuestionsWeighted tests the fetchRandomQuestionsWeighted helper
func (suite *QuestionHelperTestSuite) TestFetchRandomQuestionsWeighted() {
	// count=5 bucket quota breakdown (5:3:2 ratio):
	//   quota1 = 5*5/10 = 2 (unpractised)
	//   quota2 = 5*3/10 = 1 (high-failure-rate)
	//   quota3 = 5-2-1  = 2 (high-success-rate)
	// Each bucket fills its quota exactly so no cascade occurs.
	mockPeer := mocks.NewMockQuestionPeer(suite.T())
	controller := NewQuestionController(mockPeer)
	sampleQuestions := getSampleQuestions()

	randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
		return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
	})
	limit1 := uint64(2)
	limit2 := uint64(1)
	limit3 := uint64(2)

	// Bucket 1: unpractised (count_practise = 0) → returns 2 items, fills quota exactly
	mockPeer.EXPECT().
		Select(mock.Anything, squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, randomOrderMatcher, &limit1, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[0], sampleQuestions[1]}, nil).Times(1)

	// Bucket 2: high failure rate → returns 1 item, fills quota exactly
	mockPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit2, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[2]}, nil).Times(1)

	// Bucket 3: high success rate → returns 2 items, fills quota exactly
	mockPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit3, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[3], sampleQuestions[4]}, nil).Times(1)

	// Poke the method
	result, err := controller.fetchRandomQuestionsWeighted(5)

	// Verify the result contains all expected questions (order varies due to shuffle)
	assert.NoError(suite.T(), err)
	assert.ElementsMatch(suite.T(), sampleQuestions, result)
}
