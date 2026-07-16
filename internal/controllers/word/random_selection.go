package word

import (
	"fmt"
	"log/slog"
	"math/rand"
	"slices"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
)

// familiarityWeights defines the relative weight used to split a quota across
// familiarity levels, mirroring the emphasis Questions place on their
// unpractised/high-failure/high-success 5:3:2 split: words the user is least
// familiar with (red) get the largest share of any given quiz's word count.
var familiarityWeights = map[string]int{
	schema.WORD_FAMILIARITY_RED:    7,
	schema.WORD_FAMILIARITY_YELLOW: 5,
	schema.WORD_FAMILIARITY_GREEN:  3,
}

// familiarityWeightOrder fixes the order quotas are assigned in computeLevelQuotas
// so the rounding remainder is always absorbed by the last level processed.
var familiarityWeightOrder = []string{
	schema.WORD_FAMILIARITY_RED,
	schema.WORD_FAMILIARITY_YELLOW,
	schema.WORD_FAMILIARITY_GREEN,
}

// familiarityCascadeOrder fixes the fetch order for fetchRandomWordsWeighted:
// lowest-priority level first, so a quota shortfall in an easier level cascades
// upward into the level the user most needs to practice. Mirrors the shape of
// fetchRandomQuestionsWeighted's bucket3 -> bucket2 -> bucket1 cascade.
var familiarityCascadeOrder = []string{
	schema.WORD_FAMILIARITY_GREEN,
	schema.WORD_FAMILIARITY_YELLOW,
	schema.WORD_FAMILIARITY_RED,
}

// computeLevelQuotas splits totalCount across levels using familiarityWeights,
// restricted and renormalized to whichever levels are present in levels (e.g.
// if red is excluded, yellow:green are renormalized to 5:3 between themselves).
// The last level in familiarityWeightOrder absorbs the rounding remainder so
// the quotas always sum to exactly totalCount, regardless of integer division.
func computeLevelQuotas(totalCount int, levels []string) map[string]int {
	quotas := make(map[string]int)
	if totalCount <= 0 {
		return quotas
	}

	var selected []string
	weightSum := 0
	for _, level := range familiarityWeightOrder {
		if slices.Contains(levels, level) {
			selected = append(selected, level)
			weightSum += familiarityWeights[level]
		}
	}
	if weightSum == 0 {
		return quotas
	}

	remaining := totalCount
	for i, level := range selected {
		if i == len(selected)-1 {
			quotas[level] = remaining
			break
		}
		quota := totalCount * familiarityWeights[level] / weightSum
		quotas[level] = quota
		remaining -= quota
	}

	return quotas
}

// fetchWordsBucketWeighted retrieves up to quota words for a single familiarity
// level, prioritizing words that have never been practiced, then words practiced
// longest ago. These two groups exhaustively partition the level (every word is
// either never-practiced or has a last_practiced_at), so no further same-level
// fallback is needed here — any unmet quota is a genuine shortage of words in
// this level and is left for the caller to cascade into another level.
func (wc *Controller) fetchWordsBucketWeighted(level string, quota int) ([]*dbModels.Word, error) {
	if quota <= 0 {
		return []*dbModels.Word{}, nil
	}

	levelWhere := squirrel.Eq{schema.WORD_FAMILIARITY: level}
	randomOrderBy := database.TERM_MAPPING_FUNC_RANDOM
	limit := uint64(quota)

	neverPracticedWhere := squirrel.And{
		levelWhere,
		squirrel.Or{
			squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
			squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
		},
	}
	neverPracticed, err := wc.wordPeer.Select([]*string{}, neverPracticedWhere, []*string{&randomOrderBy}, &limit, nil)
	if err != nil {
		return nil, err
	}

	remaining := quota - len(neverPracticed)
	if remaining <= 0 {
		return neverPracticed, nil
	}

	leastRecentWhere := squirrel.And{
		levelWhere,
		squirrel.Gt{schema.WORD_COUNT_PRACTISE: 0},
		squirrel.NotEq{schema.WORD_LAST_PRACTISED_AT: nil},
	}
	remainingLimit := uint64(remaining)
	oldestFirst := fmt.Sprintf("%s ASC", schema.WORD_LAST_PRACTISED_AT)
	leastRecent, err := wc.wordPeer.Select([]*string{}, leastRecentWhere, []*string{&oldestFirst}, &remainingLimit, nil)
	if err != nil {
		return nil, err
	}

	return append(neverPracticed, leastRecent...), nil
}

// fetchRandomWordsWeighted fetches words for each level in quotasByLevel using
// fetchWordsBucketWeighted, cascading any quota shortfall (per familiarityCascadeOrder)
// from lower-priority levels up into higher-priority ones, then shuffles the
// combined result so words aren't grouped by level or practice recency.
func (wc *Controller) fetchRandomWordsWeighted(quotasByLevel map[string]int) ([]*dbModels.Word, error) {
	requested := 0
	for _, quota := range quotasByLevel {
		requested += quota
	}

	var active []string
	for _, level := range familiarityCascadeOrder {
		if quotasByLevel[level] > 0 {
			active = append(active, level)
		}
	}

	var combined []*dbModels.Word
	carry := 0
	for _, level := range active {
		quota := quotasByLevel[level] + carry
		words, err := wc.fetchWordsBucketWeighted(level, quota)
		if err != nil {
			return nil, err
		}
		common.LogRandomSelectionResult("Random word bucket fetched.", quota, len(words), "level", level, "expected", quota, "actual", len(words))
		carry = quota - len(words)
		combined = append(combined, words...)
	}

	rand.Shuffle(len(combined), func(i, j int) {
		combined[i], combined[j] = combined[j], combined[i]
	})

	if carry > 0 {
		slog.Warn("Random word selection short of requested count; no fallback bucket available.", "requested", requested, "returned", len(combined), "shortfall", carry)
	} else {
		slog.Debug("Random words selected.", "requested", requested, "returned", len(combined))
	}

	return combined, nil
}
