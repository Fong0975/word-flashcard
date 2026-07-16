package question

import (
	"slices"
	"strings"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// validateQuestionFields validates the content of the requested question
func (qc *Controller) validateQuestionFields(question *models.Question, isUpdate bool) error {
	// question: VARCHAR(1024), NOT NULL
	if err := common.ValidateStringField(question.Question, isUpdate, "question", 1024, false); err != nil {
		return err
	}

	// option_a: VARCHAR(255), NOT NULL
	if err := common.ValidateStringField(question.OptionA, isUpdate, "option_a", 255, false); err != nil {
		return err
	}

	// option_b: VARCHAR(255), Allow NULL
	if err := common.ValidateStringField(question.OptionB, isUpdate, "option_b", 255, true); err != nil {
		return err
	}

	// option_c: VARCHAR(255), Allow NULL
	if err := common.ValidateStringField(question.OptionC, isUpdate, "option_c", 255, true); err != nil {
		return err
	}

	// option_d: VARCHAR(255), Allow NULL
	if err := common.ValidateStringField(question.OptionD, isUpdate, "option_d", 255, true); err != nil {
		return err
	}

	// answer: VARCHAR(5), NOT NULL
	listAnswer := []string{"A", "B", "C", "D"}
	if err := common.ValidateStringField(question.Answer, isUpdate, "answer", 5, false); err != nil {
		return err
	} else if question.Answer != nil && !slices.Contains(listAnswer, strings.ToUpper(*question.Answer)) {
		return common.NewFieldError("answer is invalid", "value", *question.Answer, "allowed", strings.Join(listAnswer, ","))
	}

	// reference: VARCHAR(255), Allow NULL
	if err := common.ValidateStringField(question.Reference, isUpdate, "reference", 255, true); err != nil {
		return err
	}

	// notes: TEXT, Allow NULL
	if err := common.ValidateStringField(question.Notes, isUpdate, "notes", 21845, true); err != nil {
		return err
	}

	// count_practise: INT, > 0
	if question.CountPractise != nil && *question.CountPractise < 0 {
		return common.NewFieldError("count_practise is invalid", "reason", "negative value", "value", *question.CountPractise)
	}

	// count_failure_practise: INT, > 0, <= count_practise
	if question.CountFailurePractise != nil {
		switch {
		case question.CountPractise == nil:
			return common.NewFieldError("count_failure_practise is invalid", "reason", "count_practise is required when count_failure_practise is set")
		case *question.CountFailurePractise < 0:
			return common.NewFieldError("count_failure_practise is invalid", "reason", "negative value", "value", *question.CountFailurePractise)
		case *question.CountFailurePractise > *question.CountPractise:
			return common.NewFieldError("count_failure_practise is invalid",
				"reason", "exceeds count_practise",
				"count_failure_practise", *question.CountFailurePractise,
				"count_practise", *question.CountPractise)
		}
	}

	// selected_option: must be one of A-D when provided (quiz-answer logging)
	if question.SelectedOption != nil && !slices.Contains(listAnswer, strings.ToUpper(*question.SelectedOption)) {
		return common.NewFieldError("selected_option is invalid", "value", *question.SelectedOption, "allowed", strings.Join(listAnswer, ","))
	}

	return nil
}
