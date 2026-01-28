package models

import "time"

// WordDefinition represents a word definition record from the database
type WordDefinition struct {
	Id           int       `db:"id" json:"id"`
	WordId       int       `db:"word_id" json:"word_id"`
	PartOfSpeech string    `db:"part_of_speech" json:"part_of_speech"`
	Definition   string    `db:"definition" json:"definition"`
	Phonetics    string    `db:"phonetics" json:"phonetics"`
	Examples     string    `db:"examples" json:"examples"`
	Notes        string    `db:"notes" json:"notes"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
