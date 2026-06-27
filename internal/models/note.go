package models

import (
	"time"
	"word-flashcard/data/models"
)

// Note represents a note card used in both requests and responses
type Note struct {
	ID        *int       `json:"id"`
	Title     *string    `json:"title"`
	Content   *string    `json:"content"`
	SortOrder *int       `json:"sort_order"`
	UpdatedAt *time.Time `json:"updated_at"`
}

// FromDataModel converts a data model Note to the API model Note
func (n *Note) FromDataModel(dbNote *models.Note) *Note {
	n.ID = dbNote.Id
	n.Title = dbNote.Title
	n.Content = dbNote.Content
	n.SortOrder = dbNote.SortOrder
	n.UpdatedAt = dbNote.UpdatedAt
	return n
}

// ToDataModel converts the API model Note to the data model Note
func (n *Note) ToDataModel() *models.Note {
	return &models.Note{
		Id:        n.ID,
		Title:     n.Title,
		Content:   n.Content,
		SortOrder: n.SortOrder,
	}
}
