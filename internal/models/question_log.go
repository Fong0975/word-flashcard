package models

import "time"

// QuestionAnswerLogEntry is a single entry in a question's recent answer
// history, returned by GET /api/questions/{id}/logs.
type QuestionAnswerLogEntry struct {
	ID             int       `json:"id"`
	SelectedOption string    `json:"selected_option"`
	IsCorrect      bool      `json:"is_correct"`
	CreatedAt      time.Time `json:"created_at"`
}

// QuestionTrendPoint is one day's aggregated answer trend for a question,
// returned by GET /api/questions/{id}/trend. Days with PracticeCount == 0 are
// still included, but AccuracyRate is null on them so "no answers" stays
// distinguishable from a genuine 0% accuracy.
type QuestionTrendPoint struct {
	Date          string   `json:"date"`
	PracticeCount int      `json:"practice_count"`
	AccuracyRate  *float64 `json:"accuracy_rate" extensions:"x-nullable"`
}
