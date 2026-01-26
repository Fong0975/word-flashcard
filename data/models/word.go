package models

import "time"

// Word represents a word record from the database
type Word struct {
	ID          int       `db:"id" json:"id"`
	Word        string    `db:"word" json:"word"`
	Familiarity string    `db:"familiarity" json:"familiarity"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}
