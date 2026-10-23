package models

import "time"

// WordPracticeLogEntry is a single entry in a word's recent practice
// history, returned by GET /api/words/{id}/logs.
type WordPracticeLogEntry struct {
	ID                  int       `json:"id"`
	Familiarity         string    `json:"familiarity"`
	PreviousFamiliarity string    `json:"previous_familiarity"`
	CreatedAt           time.Time `json:"created_at"`
}

// WordTrendPoint is one day's aggregated practice trend for a word, returned
// by GET /api/words/{id}/trend. Days with PracticeCount == 0 are still
// included, but ImprovementRate and AvgFamiliarityScore are null on them so
// "no practice" stays distinguishable from a genuine 0% rate.
type WordTrendPoint struct {
	Date                string   `json:"date"`
	PracticeCount       int      `json:"practice_count"`
	ImprovementRate     *float64 `json:"improvement_rate" extensions:"x-nullable"`
	AvgFamiliarityScore *float64 `json:"avg_familiarity_score" extensions:"x-nullable"`
}
