package models

import "time"

// QuestionAnswerLog represents a single quiz answer for a question, including
// which option (matching the question's own option_a-d ordering) was selected.
type QuestionAnswerLog struct {
	Id             *int       `db:"id" json:"id"`
	QuestionId     *int       `db:"question_id" json:"question_id"`
	SelectedOption *string    `db:"selected_option" json:"selected_option"`
	IsCorrect      *bool      `db:"is_correct" json:"is_correct"`
	CreatedAt      *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      *time.Time `db:"updated_at" json:"updated_at"`
}
