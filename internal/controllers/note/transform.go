package note

import (
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
)

// convertToNoteEntities converts database models to API models
func (nc *Controller) convertToNoteEntities(notes []*dbModels.Note) []*models.Note {
	var noteEntities []*models.Note
	for _, note := range notes {
		noteEntity := new(models.Note).FromDataModel(note)
		noteEntities = append(noteEntities, noteEntity)
	}
	return noteEntities
}
