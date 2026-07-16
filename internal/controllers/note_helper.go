package controllers

import (
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// convertToNoteEntities converts database models to API models
func (nc *NoteController) convertToNoteEntities(notes []*dbModels.Note) []*models.Note {
	var noteEntities []*models.Note
	for _, note := range notes {
		noteEntity := new(models.Note).FromDataModel(note)
		noteEntities = append(noteEntities, noteEntity)
	}
	return noteEntities
}

// validateNoteFields validates the content of the requested note
func (nc *NoteController) validateNoteFields(note *models.Note, isUpdate bool) error {
	// title: VARCHAR(255), NOT NULL
	if err := common.ValidateStringField(note.Title, isUpdate, "title", 255, false); err != nil {
		return err
	}

	// content: TEXT, Allow NULL
	if err := common.ValidateStringField(note.Content, isUpdate, "content", 21845, true); err != nil {
		return err
	}

	return nil
}
