package models

import "time"

// Note represents a note card record from the database
type Note struct {
	Id        *int       `db:"id" json:"id"`
	Title     *string    `db:"title" json:"title"`
	Content   *string    `db:"content" json:"content"`
	SortOrder *int       `db:"sort_order" json:"sort_order"`
	CreatedAt *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt *time.Time `db:"updated_at" json:"updated_at"`
}
