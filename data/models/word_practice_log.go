package models

import "time"

// WordPracticeLog represents a single quiz answer's familiarity change for a word.
type WordPracticeLog struct {
	Id                  *int       `db:"id" json:"id"`
	WordId              *int       `db:"word_id" json:"word_id"`
	Familiarity         *string    `db:"familiarity" json:"familiarity"`
	PreviousFamiliarity *string    `db:"previous_familiarity" json:"previous_familiarity"`
	CreatedAt           *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt           *time.Time `db:"updated_at" json:"updated_at"`
}
