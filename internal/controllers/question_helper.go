package controllers

import (
	"errors"
	"fmt"
	"math/rand"
	"slices"
	"strings"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
)

// convertToEntities converts database models to API models
func (qc *QuestionController) convertToEntities(questions []*dbModels.Question) []*models.Question {
	var questionEntities []*models.Question
	for _, question := range questions {
		questionEntity := new(models.Question).FromDataModel(question)
		questionEntities = append(questionEntities, questionEntity)
	}

	return questionEntities
}

// validateQuestionFields validates the content of the requested question
func (qc *QuestionController) validateQuestionFields(question *models.Question, isUpdate bool) error {
	// question: VARCHAR(1024), NOT NULL
	if err := validateStringField(question.Question, isUpdate, "question", 1024, false); err != nil {
		return err
	}

	// option_a: VARCHAR(255), NOT NULL
	if err := validateStringField(question.OptionA, isUpdate, "option_a", 255, false); err != nil {
		return err
	}

	// option_b: VARCHAR(255), Allow NULL
	if err := validateStringField(question.OptionB, isUpdate, "option_b", 255, true); err != nil {
		return err
	}

	// option_c: VARCHAR(255), Allow NULL
	if err := validateStringField(question.OptionC, isUpdate, "option_c", 255, true); err != nil {
		return err
	}

	// option_d: VARCHAR(255), Allow NULL
	if err := validateStringField(question.OptionD, isUpdate, "option_d", 255, true); err != nil {
		return err
	}

	// answer: VARCHAR(5), NOT NULL
	listAnswer := []string{"A", "B", "C", "D"}
	if err := validateStringField(question.Answer, isUpdate, "answer", 5, false); err != nil {
		return err
	} else if question.Answer != nil && !slices.Contains(listAnswer, strings.ToUpper(*question.Answer)) {
		return errors.New("answer is invalid")
	}

	// reference: VARCHAR(255), Allow NULL
	if err := validateStringField(question.Reference, isUpdate, "reference", 255, true); err != nil {
		return err
	}

	// notes: TEXT, Allow NULL
	if err := validateStringField(question.Notes, isUpdate, "notes", 21845, true); err != nil {
		return err
	}

	// count_practise: INT, > 0
	if question.CountPractise != nil && *question.CountPractise < 0 {
		return errors.New("count_practise is invalid")
	}

	// count_failure_practise: INT, > 0, <= count_practise
	if question.CountFailurePractise != nil && (question.CountPractise == nil || *question.CountFailurePractise < 0 || *question.CountFailurePractise > *question.CountPractise) {
		return errors.New("count_failure_practise is invalid")
	}

	return nil
}

// fetchRandomQuestionsWeighted retrieves questions using weighted bucket sampling.
// Target ratio is 5:3:2 (unpractised : high-failure-rate : high-success-rate).
// Buckets are fetched in reverse priority order so that underflow cascades upward:
// high-success-rate is fetched first and capped at its quota; any shortfall flows to
// high-failure-rate, and remaining shortfall flows to unpractised.
// This guarantees easy questions never exceed their intended 20% and the total returned
// equals count as long as enough questions exist across all buckets.
// When excludeRecentDays is set, questions created within that many days are excluded from all buckets.
func (qc *QuestionController) fetchRandomQuestionsWeighted(count int, excludeRecentDays *int) ([]*dbModels.Question, error) {
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
		squirrel.Expr(fmt.Sprintf("%s * 2 >= %s", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}, excludeBefore)
	bucket3Where := applyDateFilter(squirrel.And{
		squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0},
		squirrel.Expr(fmt.Sprintf("%s * 2 < %s", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}, excludeBefore)

	// Fetch lowest-priority bucket first; underflow cascades up to harder buckets
	bucket3, err := qc.fetchQuestionBucket(bucket3Where, quota3)
	if err != nil {
		return nil, err
	}
	quota2 += quota3 - len(bucket3)

	bucket2, err := qc.fetchQuestionBucket(bucket2Where, quota2)
	if err != nil {
		return nil, err
	}
	quota1 += quota2 - len(bucket2)

	bucket1, err := qc.fetchQuestionBucket(bucket1Where, quota1)
	if err != nil {
		return nil, err
	}

	// Merge all buckets and shuffle to avoid ordering bias
	combined := append(append(bucket1, bucket2...), bucket3...)
	rand.Shuffle(len(combined), func(i, j int) {
		combined[i], combined[j] = combined[j], combined[i]
	})

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
func (qc *QuestionController) fetchQuestionBucket(where squirrel.Sqlizer, limit int) ([]*dbModels.Question, error) {
	if limit <= 0 {
		return []*dbModels.Question{}, nil
	}

	limitPtr := uint64(limit)
	orderBy := database.TERM_MAPPING_FUNC_RANDOM
	return qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
}

// validateStringField Verify the string field is empty and its length
func validateStringField(field *string, isUpdate bool, name string, length int, nullable bool) error {
	if !nullable && !isUpdate && (field == nil || *field == "") {
		return errors.New(name + " is invalid")
	} else if field != nil && len(*field) > length {
		return errors.New(name + " is invalid")
	}

	return nil
}
