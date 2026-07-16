package note

import (
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// validateNoteFields validates the content of the requested note
func (nc *Controller) validateNoteFields(note *models.Note, isUpdate bool) error {
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
