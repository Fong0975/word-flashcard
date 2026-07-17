package word

import (
	"fmt"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/mock"
)

// TestComputeLevelQuotas tests the computeLevelQuotas quota-splitting logic
func (suite *HelperTestSuite) TestComputeLevelQuotas() {
	testCases := []struct {
		name     string
		total    int
		levels   []string
		expected map[string]int
	}{
		{
			name:   "all three levels split 7:5:3, remainder absorbed by green",
			total:  20,
			levels: []string{schema.WORD_FAMILIARITY_RED, schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN},
			expected: map[string]int{
				schema.WORD_FAMILIARITY_RED:    9,
				schema.WORD_FAMILIARITY_YELLOW: 6,
				schema.WORD_FAMILIARITY_GREEN:  5,
			},
		},
		{
			name:   "red excluded, yellow:green renormalized to 5:3",
			total:  20,
			levels: []string{schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN},
			expected: map[string]int{
				schema.WORD_FAMILIARITY_YELLOW: 12,
				schema.WORD_FAMILIARITY_GREEN:  8,
			},
		},
		{
			name:   "single level gets the whole quota",
			total:  20,
			levels: []string{schema.WORD_FAMILIARITY_GREEN},
			expected: map[string]int{
				schema.WORD_FAMILIARITY_GREEN: 20,
			},
		},
		{
			name:     "zero total yields no quotas",
			total:    0,
			levels:   []string{schema.WORD_FAMILIARITY_RED},
			expected: map[string]int{},
		},
		{
			name:     "no levels selected yields no quotas",
			total:    20,
			levels:   []string{},
			expected: map[string]int{},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			result := computeLevelQuotas(tc.total, tc.levels)
			suite.Equal(tc.expected, result)
		})
	}
}

// TestFetchWordsBucketWeighted tests the single-level cascading (never-practiced
// then least-recently-practiced) selection logic
func (suite *HelperTestSuite) TestFetchWordsBucketWeighted() {
	suite.Run("non-positive quota returns empty without querying", func() {
		result, err := suite.controller.fetchWordsBucketWeighted(schema.WORD_FAMILIARITY_RED, 0)
		suite.NoError(err)
		suite.Empty(result)
	})

	suite.Run("never-practiced bucket alone fills the quota", func() {
		id1, id2 := 10, 11
		fam := schema.WORD_FAMILIARITY_RED
		neverPracticed := []*dbModels.Word{{Id: &id1, Familiarity: &fam}, {Id: &id2, Familiarity: &fam}}

		levelWhere := squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_RED}
		neverPracticedWhere := squirrel.And{
			levelWhere,
			squirrel.Or{
				squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
				squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
			},
		}
		limit := uint64(2)
		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})

		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, neverPracticedWhere, randomOrderMatcher, &limit, (*uint64)(nil)).
			Return(neverPracticed, nil).Once()

		result, err := suite.controller.fetchWordsBucketWeighted(schema.WORD_FAMILIARITY_RED, 2)

		suite.NoError(err)
		suite.ElementsMatch(neverPracticed, result)
	})

	suite.Run("shortfall cascades from never-practiced into least-recently-practiced", func() {
		id1 := 20
		fam := schema.WORD_FAMILIARITY_YELLOW
		neverPracticed := []*dbModels.Word{{Id: &id1, Familiarity: &fam}}

		id2, id3 := 21, 22
		leastRecent := []*dbModels.Word{{Id: &id2, Familiarity: &fam}, {Id: &id3, Familiarity: &fam}}

		levelWhere := squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW}
		neverPracticedWhere := squirrel.And{
			levelWhere,
			squirrel.Or{
				squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
				squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
			},
		}
		leastRecentWhere := squirrel.And{
			levelWhere,
			squirrel.Gt{schema.WORD_COUNT_PRACTISE: 0},
			squirrel.NotEq{schema.WORD_LAST_PRACTISED_AT: nil},
		}

		quotaLimit := uint64(3)
		remainingLimit := uint64(2)
		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})
		oldestFirstMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == fmt.Sprintf("%s ASC", schema.WORD_LAST_PRACTISED_AT)
		})

		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, neverPracticedWhere, randomOrderMatcher, &quotaLimit, (*uint64)(nil)).
			Return(neverPracticed, nil).Once()
		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, leastRecentWhere, oldestFirstMatcher, &remainingLimit, (*uint64)(nil)).
			Return(leastRecent, nil).Once()

		result, err := suite.controller.fetchWordsBucketWeighted(schema.WORD_FAMILIARITY_YELLOW, 3)

		suite.NoError(err)
		suite.ElementsMatch(append(neverPracticed, leastRecent...), result)
	})
}

// TestFetchRandomWordsWeighted tests cross-level quota cascading and shuffling
func (suite *HelperTestSuite) TestFetchRandomWordsWeighted() {
	suite.Run("skips levels with zero quota, cascades shortfall low-to-high priority", func() {
		greenID := 30
		greenFam := schema.WORD_FAMILIARITY_GREEN
		green := []*dbModels.Word{{Id: &greenID, Familiarity: &greenFam}} // only 1 of 2 requested

		yellowID1, yellowID2, yellowID3 := 31, 32, 33
		yellowFam := schema.WORD_FAMILIARITY_YELLOW
		yellow := []*dbModels.Word{
			{Id: &yellowID1, Familiarity: &yellowFam},
			{Id: &yellowID2, Familiarity: &yellowFam},
			{Id: &yellowID3, Familiarity: &yellowFam},
		} // fills its own quota (2) plus green's carried shortfall (1)

		greenWhere := squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_GREEN}
		greenNeverPracticedWhere := squirrel.And{
			greenWhere,
			squirrel.Or{
				squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
				squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
			},
		}
		greenLeastRecentWhere := squirrel.And{
			greenWhere,
			squirrel.Gt{schema.WORD_COUNT_PRACTISE: 0},
			squirrel.NotEq{schema.WORD_LAST_PRACTISED_AT: nil},
		}
		yellowWhere := squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW}
		yellowNeverPracticedWhere := squirrel.And{
			yellowWhere,
			squirrel.Or{
				squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
				squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
			},
		}

		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})
		greenQuota := uint64(2)
		greenRemaining := uint64(1)
		yellowQuota := uint64(3) // yellow's own quota (2) + green's shortfall (1)

		// Green: quota 2, never-practiced returns 1, least-recent returns 0 -> shortfall 1 carries to yellow.
		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, greenNeverPracticedWhere, randomOrderMatcher, &greenQuota, (*uint64)(nil)).
			Return(green, nil).Once()
		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, greenLeastRecentWhere, mock.Anything, &greenRemaining, (*uint64)(nil)).
			Return([]*dbModels.Word{}, nil).Once()

		// Yellow: quota 2 + carried 1 = 3, fully satisfied by never-practiced alone.
		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, yellowNeverPracticedWhere, randomOrderMatcher, &yellowQuota, (*uint64)(nil)).
			Return(yellow, nil).Once()

		result, err := suite.controller.fetchRandomWordsWeighted(map[string]int{
			schema.WORD_FAMILIARITY_GREEN:  2,
			schema.WORD_FAMILIARITY_YELLOW: 2,
		})

		suite.NoError(err)
		suite.ElementsMatch(append(green, yellow...), result)
	})

	suite.Run("zero-quota level (e.g. red excluded by the user) is never queried", func() {
		yellowID := 40
		yellowFam := schema.WORD_FAMILIARITY_YELLOW
		yellow := []*dbModels.Word{{Id: &yellowID, Familiarity: &yellowFam}}

		yellowWhere := squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW}
		yellowNeverPracticedWhere := squirrel.And{
			yellowWhere,
			squirrel.Or{
				squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
				squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
			},
		}
		randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
			return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
		})
		limit := uint64(1)

		suite.mockWordPeer.EXPECT().
			Select(mock.Anything, yellowNeverPracticedWhere, randomOrderMatcher, &limit, (*uint64)(nil)).
			Return(yellow, nil).Once()

		result, err := suite.controller.fetchRandomWordsWeighted(map[string]int{
			schema.WORD_FAMILIARITY_RED:    0,
			schema.WORD_FAMILIARITY_YELLOW: 1,
		})

		suite.NoError(err)
		suite.ElementsMatch(yellow, result)
	})
}
