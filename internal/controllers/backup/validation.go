package backup

import (
	"fmt"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// validateExport checks that every row of every table carries the fields
// its own schema requires (NOT NULL columns) before RestoreAll ever begins
// its transaction. This turns an obviously incomplete or hand-edited export
// file into a plain 400 response instead of a mid-transaction database
// error (row-level foreign key violations are still left to the database
// itself -- see RestoreAll's transaction rollback).
func validateExport(export *models.DataExport) error {
	if err := validateWords(export.Words); err != nil {
		return err
	}
	if err := validateWordDefinitions(export.WordDefinitions); err != nil {
		return err
	}
	if err := validateQuestions(export.Questions); err != nil {
		return err
	}
	if err := validateQuestionAnswerLogs(export.QuestionAnswerLogs); err != nil {
		return err
	}
	if err := validateWordPracticeLogs(export.WordPracticeLogs); err != nil {
		return err
	}
	return validateNotes(export.Notes)
}

func validateWords(words []*dbModels.Word) error {
	for i, word := range words {
		if word.Id == nil {
			return common.NewFieldError(fmt.Sprintf("words[%d]: id is required", i))
		}
		if word.Word == nil {
			return common.NewFieldError(fmt.Sprintf("words[%d]: word is required", i))
		}
		if word.Familiarity == nil {
			return common.NewFieldError(fmt.Sprintf("words[%d]: familiarity is required", i))
		}
		if word.CountPractise == nil {
			return common.NewFieldError(fmt.Sprintf("words[%d]: count_practise is required", i))
		}
		if word.CreatedAt == nil || word.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("words[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}

func validateWordDefinitions(definitions []*dbModels.WordDefinition) error {
	for i, def := range definitions {
		if def.Id == nil {
			return common.NewFieldError(fmt.Sprintf("word_definitions[%d]: id is required", i))
		}
		if def.WordId == nil {
			return common.NewFieldError(fmt.Sprintf("word_definitions[%d]: word_id is required", i))
		}
		if def.PartOfSpeech == nil {
			return common.NewFieldError(fmt.Sprintf("word_definitions[%d]: part_of_speech is required", i))
		}
		if def.Definition == nil {
			return common.NewFieldError(fmt.Sprintf("word_definitions[%d]: definition is required", i))
		}
		if def.CreatedAt == nil || def.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("word_definitions[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}

func validateQuestions(questions []*dbModels.Question) error {
	for i, question := range questions {
		if question.Id == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: id is required", i))
		}
		if question.Question == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: question is required", i))
		}
		if question.OptionA == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: option_a is required", i))
		}
		if question.Answer == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: answer is required", i))
		}
		if question.CountPractise == nil || question.CountFailurePractise == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: count_practise/count_failure_practise are required", i))
		}
		if question.CreatedAt == nil || question.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("questions[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}

func validateQuestionAnswerLogs(logs []*dbModels.QuestionAnswerLog) error {
	for i, log := range logs {
		if log.Id == nil {
			return common.NewFieldError(fmt.Sprintf("question_answer_logs[%d]: id is required", i))
		}
		if log.QuestionId == nil {
			return common.NewFieldError(fmt.Sprintf("question_answer_logs[%d]: question_id is required", i))
		}
		if log.SelectedOption == nil {
			return common.NewFieldError(fmt.Sprintf("question_answer_logs[%d]: selected_option is required", i))
		}
		if log.IsCorrect == nil {
			return common.NewFieldError(fmt.Sprintf("question_answer_logs[%d]: is_correct is required", i))
		}
		if log.CreatedAt == nil || log.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("question_answer_logs[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}

func validateWordPracticeLogs(logs []*dbModels.WordPracticeLog) error {
	for i, log := range logs {
		if log.Id == nil {
			return common.NewFieldError(fmt.Sprintf("word_practice_logs[%d]: id is required", i))
		}
		if log.WordId == nil {
			return common.NewFieldError(fmt.Sprintf("word_practice_logs[%d]: word_id is required", i))
		}
		if log.Familiarity == nil {
			return common.NewFieldError(fmt.Sprintf("word_practice_logs[%d]: familiarity is required", i))
		}
		if log.PreviousFamiliarity == nil {
			return common.NewFieldError(fmt.Sprintf("word_practice_logs[%d]: previous_familiarity is required", i))
		}
		if log.CreatedAt == nil || log.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("word_practice_logs[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}

func validateNotes(notes []*dbModels.Note) error {
	for i, note := range notes {
		if note.Id == nil {
			return common.NewFieldError(fmt.Sprintf("notes[%d]: id is required", i))
		}
		if note.Title == nil {
			return common.NewFieldError(fmt.Sprintf("notes[%d]: title is required", i))
		}
		if note.SortOrder == nil {
			return common.NewFieldError(fmt.Sprintf("notes[%d]: sort_order is required", i))
		}
		if note.CreatedAt == nil || note.UpdatedAt == nil {
			return common.NewFieldError(fmt.Sprintf("notes[%d]: created_at/updated_at are required", i))
		}
	}
	return nil
}
