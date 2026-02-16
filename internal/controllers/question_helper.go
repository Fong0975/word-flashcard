package controllers

import (
	"errors"
	"slices"
	"strings"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
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

// validateStringField Verify the string field is empty and its length
func validateStringField(field *string, isUpdate bool, name string, length int, nullable bool) error {
	if !nullable && !isUpdate && (field == nil || *field == "") {
		return errors.New(name + " is invalid")
	} else if field != nil && len(*field) > length {
		return errors.New(name + " is invalid")
	}

	return nil
}
