package question

import (
	"encoding/json"
	"fmt"

	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestFetchQuestionBucket tests the fetchQuestionBucket helper
func (suite *HelperTestSuite) TestFetchQuestionBucket() {
	// Setup fresh mock with Select expectation
	mockPeer := mocks.NewMockQuestionPeer(suite.T())
	controller := New(mockPeer, mocks.NewMockQuestionAnswerLogPeer(suite.T()))

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
func (suite *HelperTestSuite) TestFetchRandomQuestionsWeighted() {
	// count=5 bucket quota breakdown (5:3:2 ratio):
	//   quota1 = 5*5/10 = 2 (unpractised)
	//   quota2 = 5*3/10 = 1 (high-failure-rate)
	//   quota3 = 5-2-1  = 2 (high-success-rate)
	// Buckets are fetched in reverse priority order (bucket3 → bucket2 → bucket1)
	// so underflow cascades upward to harder buckets. Buckets 2 and 3 are now
	// fetched via fetchQuestionsRecencyWeighted, whose first (never-answered)
	// sub-query uses the same RAND-order/limit shape as before; each bucket's
	// quota is fully met by that sub-query here, so the oldest-first fallback
	// sub-query never fires and no cascade occurs.
	mockPeer := mocks.NewMockQuestionPeer(suite.T())
	controller := New(mockPeer, mocks.NewMockQuestionAnswerLogPeer(suite.T()))
	sampleQuestions := getSampleQuestions()

	randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
		return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
	})
	limit1 := uint64(2)
	limit2 := uint64(1)
	limit3 := uint64(2)

	// Bucket 1: unpractised (count_practise = 0) → fetched last, returns 2 items
	mockPeer.EXPECT().
		Select(mock.Anything, squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, randomOrderMatcher, &limit1, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[0], sampleQuestions[1]}, nil).Times(1)

	// Bucket 2: high failure rate → fetched second, returns 1 item
	mockPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit2, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[2]}, nil).Times(1)

	// Bucket 3: high success rate → fetched first, returns 2 items
	mockPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit3, (*uint64)(nil)).
		Return([]*dbModels.Question{sampleQuestions[3], sampleQuestions[4]}, nil).Times(1)

	// Poke the method
	result, err := controller.fetchRandomQuestionsWeighted(5, nil)

	// Verify the result contains all expected questions (order varies due to shuffle)
	assert.NoError(suite.T(), err)
	assert.ElementsMatch(suite.T(), sampleQuestions, result)
}

// TestFetchQuestionsRecencyWeighted tests the fetchQuestionsRecencyWeighted helper
func (suite *HelperTestSuite) TestFetchQuestionsRecencyWeighted() {
	baseWhere := squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0}

	suite.Run("non-positive quota returns empty without querying", func() {
		mockPeer := mocks.NewMockQuestionPeer(suite.T())
		controller := New(mockPeer, mocks.NewMockQuestionAnswerLogPeer(suite.T()))

		result, err := controller.fetchQuestionsRecencyWeighted(baseWhere, 0)

		assert.NoError(suite.T(), err)
		assert.Empty(suite.T(), result)
	})

	suite.Run("never-answered group alone fills the quota", func() {
		mockPeer := mocks.NewMockQuestionPeer(suite.T())
		controller := New(mockPeer, mocks.NewMockQuestionAnswerLogPeer(suite.T()))
		sampleQuestions := getSampleQuestions()

		noTimestampWhere := squirrel.And{baseWhere, squirrel.Eq{schema.QUESTION_LAST_ANSWERED_AT: nil}}
		limit := uint64(2)
		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})

		mockPeer.EXPECT().
			Select(mock.Anything, noTimestampWhere, randomOrderMatcher, &limit, (*uint64)(nil)).
			Return([]*dbModels.Question{sampleQuestions[0], sampleQuestions[1]}, nil).Times(1)

		result, err := controller.fetchQuestionsRecencyWeighted(baseWhere, 2)

		assert.NoError(suite.T(), err)
		assert.ElementsMatch(suite.T(), []*dbModels.Question{sampleQuestions[0], sampleQuestions[1]}, result)
	})

	suite.Run("shortfall cascades from never-answered into oldest-answered-first", func() {
		mockPeer := mocks.NewMockQuestionPeer(suite.T())
		controller := New(mockPeer, mocks.NewMockQuestionAnswerLogPeer(suite.T()))
		sampleQuestions := getSampleQuestions()

		noTimestampWhere := squirrel.And{baseWhere, squirrel.Eq{schema.QUESTION_LAST_ANSWERED_AT: nil}}
		oldestWhere := squirrel.And{baseWhere, squirrel.NotEq{schema.QUESTION_LAST_ANSWERED_AT: nil}}
		quotaLimit := uint64(3)
		remainingLimit := uint64(2)
		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})
		oldestFirstMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == fmt.Sprintf("%s ASC", schema.QUESTION_LAST_ANSWERED_AT)
		})

		mockPeer.EXPECT().
			Select(mock.Anything, noTimestampWhere, randomOrderMatcher, &quotaLimit, (*uint64)(nil)).
			Return([]*dbModels.Question{sampleQuestions[0]}, nil).Times(1)
		mockPeer.EXPECT().
			Select(mock.Anything, oldestWhere, oldestFirstMatcher, &remainingLimit, (*uint64)(nil)).
			Return([]*dbModels.Question{sampleQuestions[1], sampleQuestions[2]}, nil).Times(1)

		result, err := controller.fetchQuestionsRecencyWeighted(baseWhere, 3)

		assert.NoError(suite.T(), err)
		assert.ElementsMatch(
			suite.T(),
			[]*dbModels.Question{sampleQuestions[0], sampleQuestions[1], sampleQuestions[2]},
			result,
		)
	})
}
