package question

import (
	"fmt"
	"math/rand"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
)

// fetchRandomQuestionsWeighted retrieves questions using weighted bucket sampling.
// Target ratio is 5:3:2 (unpractised : high-failure-rate : high-success-rate).
// Within the high-failure and high-success buckets, questions that have never
// been answered (since last_answered_at tracking began) are prioritized, then
// the ones answered longest ago — see fetchQuestionsRecencyWeighted. The
// unpractised bucket has no recency concept, so it stays plain random.
//
// Phase 1: buckets are fetched in reverse priority order with the date filter applied,
// so recent questions are avoided and underflow cascades upward to harder buckets.
//
// Phase 2: if phase 1 yields fewer questions than count (e.g. because all unpractised
// questions are recent), the remaining quota is filled from any question not already
// selected, ignoring the date filter. This ensures the total returned equals count
// as long as the total question pool is large enough.
//
// Bucket/fallback/summary counts below are logged via logRandomSelectionResult,
// which stays at Debug when the actual count matches what was expected and
// escalates to Warn on a shortfall.
func (qc *Controller) fetchRandomQuestionsWeighted(count int, excludeRecentDays *int) ([]*dbModels.Question, error) {
	var excludeBefore *time.Time
	if excludeRecentDays != nil && *excludeRecentDays > 0 {
		t := time.Now().AddDate(0, 0, -*excludeRecentDays)
		excludeBefore = &t
	}

	quota1 := count * 5 / 10
	quota2 := count * 3 / 10
	quota3 := count - quota1 - quota2

	bucket1Where := applyDateFilter(squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, excludeBefore)
	bucket2Where := applyDateFilter(squirrel.And{
		squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0},
		squirrel.Expr(fmt.Sprintf("%s * 10 > %s * 3", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}, excludeBefore)
	bucket3Where := applyDateFilter(squirrel.And{
		squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0},
		squirrel.Expr(fmt.Sprintf("%s * 10 <= %s * 3", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}, excludeBefore)

	// Phase 1: fetch lowest-priority bucket first; underflow cascades up to harder buckets
	bucket3, err := qc.fetchQuestionsRecencyWeighted(bucket3Where, quota3)
	if err != nil {
		return nil, err
	}
	common.LogRandomSelectionResult("Random question bucket fetched.", quota3, len(bucket3), "bucket", "high_success", "expected", quota3, "actual", len(bucket3))
	quota2 += quota3 - len(bucket3)

	bucket2, err := qc.fetchQuestionsRecencyWeighted(bucket2Where, quota2)
	if err != nil {
		return nil, err
	}
	common.LogRandomSelectionResult("Random question bucket fetched.", quota2, len(bucket2), "bucket", "high_failure", "expected", quota2, "actual", len(bucket2))
	quota1 += quota2 - len(bucket2)

	bucket1, err := qc.fetchQuestionBucket(bucket1Where, quota1)
	if err != nil {
		return nil, err
	}
	common.LogRandomSelectionResult("Random question bucket fetched.", quota1, len(bucket1), "bucket", "unpractised", "expected", quota1, "actual", len(bucket1))

	combined := append(append(bucket1, bucket2...), bucket3...)

	// Phase 2: fill any remaining quota with recent questions (no date filter)
	if remaining := count - len(combined); remaining > 0 {
		var fallbackWhere squirrel.Sqlizer
		if len(combined) > 0 {
			selectedIDs := make([]int, len(combined))
			for i, q := range combined {
				selectedIDs[i] = *q.Id
			}
			fallbackWhere = squirrel.NotEq{schema.QUESTION_ID: selectedIDs}
		}
		fallback, err := qc.fetchQuestionBucket(fallbackWhere, remaining)
		if err != nil {
			return nil, err
		}
		common.LogRandomSelectionResult("Random question fallback triggered.", remaining, len(fallback), "expected", remaining, "actual", len(fallback))
		combined = append(combined, fallback...)
	}

	// Shuffle after all phases to avoid ordering bias
	rand.Shuffle(len(combined), func(i, j int) {
		combined[i], combined[j] = combined[j], combined[i]
	})

	common.LogRandomSelectionResult("Random questions selected.", count, len(combined), "requested", count, "returned", len(combined))

	return combined, nil
}

// applyDateFilter adds a created_at upper bound to exclude recently created records.
// Returns where unchanged when excludeBefore is nil.
func applyDateFilter(where squirrel.Sqlizer, excludeBefore *time.Time) squirrel.Sqlizer {
	if excludeBefore == nil {
		return where
	}
	return squirrel.And{where, squirrel.Lt{schema.COMMON_CREATED_AT: *excludeBefore}}
}

// fetchQuestionBucket retrieves up to limit random questions matching the given where condition
func (qc *Controller) fetchQuestionBucket(where squirrel.Sqlizer, limit int) ([]*dbModels.Question, error) {
	if limit <= 0 {
		return []*dbModels.Question{}, nil
	}

	limitPtr := uint64(limit)
	orderBy := database.TERM_MAPPING_FUNC_RANDOM
	return qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
}

// fetchQuestionsRecencyWeighted retrieves up to quota questions matching where,
// prioritizing questions with no last_answered_at yet (covers both legacy rows
// from before this tracking existed and questions never answered), then filling
// any remaining quota with the questions answered longest ago. These two groups
// exhaustively partition the input where condition, so no same-bucket fallback
// is needed here — any unmet quota is a genuine shortage within this bucket,
// left for the caller to cascade into another bucket.
func (qc *Controller) fetchQuestionsRecencyWeighted(where squirrel.Sqlizer, quota int) ([]*dbModels.Question, error) {
	if quota <= 0 {
		return []*dbModels.Question{}, nil
	}

	noTimestampWhere := squirrel.And{where, squirrel.Eq{schema.QUESTION_LAST_ANSWERED_AT: nil}}
	limit := uint64(quota)
	randomOrderBy := database.TERM_MAPPING_FUNC_RANDOM
	noTimestamp, err := qc.questionPeer.Select([]*string{}, noTimestampWhere, []*string{&randomOrderBy}, &limit, nil)
	if err != nil {
		return nil, err
	}

	remaining := quota - len(noTimestamp)
	if remaining <= 0 {
		return noTimestamp, nil
	}

	oldestWhere := squirrel.And{where, squirrel.NotEq{schema.QUESTION_LAST_ANSWERED_AT: nil}}
	remainingLimit := uint64(remaining)
	oldestFirst := fmt.Sprintf("%s ASC", schema.QUESTION_LAST_ANSWERED_AT)
	oldest, err := qc.questionPeer.Select([]*string{}, oldestWhere, []*string{&oldestFirst}, &remainingLimit, nil)
	if err != nil {
		return nil, err
	}

	return append(noTimestamp, oldest...), nil
}
