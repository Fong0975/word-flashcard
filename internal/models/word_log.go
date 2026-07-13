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
// by GET /api/words/{id}/trend. ImprovementRate and AvgFamiliarityScore are
// 0 on days with PracticeCount == 0 (zero-filled, not omitted).
type WordTrendPoint struct {
	Date                string  `json:"date"`
	PracticeCount       int     `json:"practice_count"`
	ImprovementRate     float64 `json:"improvement_rate"`
	AvgFamiliarityScore float64 `json:"avg_familiarity_score"`
}
