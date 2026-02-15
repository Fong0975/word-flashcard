package models

import "time"

// Question represents a question record from the database
type Question struct {
	Id                   *int       `db:"id" json:"id"`
	Question             *string    `db:"question" json:"question"`
	OptionA              *string    `db:"option_a" json:"option_a"`
	OptionB              *string    `db:"option_b" json:"option_b"`
	OptionC              *string    `db:"option_c" json:"option_c"`
	OptionD              *string    `db:"option_d" json:"option_d"`
	Answer               *string    `db:"answer" json:"answer"`
	Reference            *string    `db:"reference" json:"reference"`
	Notes                *string    `db:"notes" json:"notes"`
	CountPractise        *int       `db:"count_practise" json:"count_practise"`
	CountFailurePractise *int       `db:"count_failure_practise" json:"count_failure_practise"`
	CreatedAt            *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt            *time.Time `db:"updated_at" json:"updated_at"`
}
