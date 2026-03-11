package controllers

import (
	"errors"
	"fmt"
	"math/rand"
	"slices"
	"strings"
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
// Buckets are filled in priority order (5:3:2 ratio): unpractised > high-failure-rate > high-success-rate.
// If a higher-priority bucket has fewer records than its quota, the remainder cascades to the next bucket.
func (qc *QuestionController) fetchRandomQuestionsWeighted(count int) ([]*dbModels.Question, error) {
	quota1 := count * 5 / 10
	quota2 := count * 3 / 10
	quota3 := count - quota1 - quota2

	// Bucket 1: unpractised (count_practise = 0)
	bucket1, err := qc.fetchQuestionBucket(squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, quota1)
	if err != nil {
		return nil, err
	}
	quota2 += quota1 - len(bucket1)

	// Bucket 2: practised with high failure rate (count_failure_practise * 2 >= count_practise, i.e. >= 50%)
	highFailureWhere := squirrel.And{
		squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0},
		squirrel.Expr(fmt.Sprintf("%s * 2 >= %s", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}
	bucket2, err := qc.fetchQuestionBucket(highFailureWhere, quota2)
	if err != nil {
		return nil, err
	}
	quota3 += quota2 - len(bucket2)

	// Bucket 3: practised with high success rate (count_failure_practise * 2 < count_practise, i.e. < 50%)
	highSuccessWhere := squirrel.And{
		squirrel.Gt{schema.QUESTION_COUNT_PRACTISE: 0},
		squirrel.Expr(fmt.Sprintf("%s * 2 < %s", schema.QUESTION_COUNT_FAILURE_PRACTISE, schema.QUESTION_COUNT_PRACTISE)),
	}
	bucket3, err := qc.fetchQuestionBucket(highSuccessWhere, quota3)
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
