package entities

import (
	"time"
	"word-flashcard/data/models"
)

// Word represents a complete word business entity with all its definitions
type Word struct {
	ID          int               `json:"id"`
	Word        string            `json:"word"`
	Familiarity string            `json:"familiarity"`
	Definitions []*WordDefinition `json:"definitions"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// WordDefinition represents a word definition within the word entity
type WordDefinition struct {
	ID           int       `json:"id"`
	PartOfSpeech string    `json:"part_of_speech,omitempty"`
	Definition   string    `json:"definition"`
	Phonetics    string    `json:"phonetics,omitempty"`
	Examples     string    `json:"examples,omitempty"`
	Notes        string    `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// FromModels creates a Word entity from database models
func FromModels(word *models.Word, definitions []*models.WordDefinition) *Word {
	entity := &Word{
		ID:          word.Id,
		Word:        word.Word,
		Familiarity: word.Familiarity,
		CreatedAt:   word.CreatedAt,
		UpdatedAt:   word.UpdatedAt,
		Definitions: make([]*WordDefinition, len(definitions)),
	}

	for i, def := range definitions {
		entity.Definitions[i] = &WordDefinition{
			ID:           def.Id,
			PartOfSpeech: def.PartOfSpeech,
			Definition:   def.Definition,
			Phonetics:    def.Phonetics,
			Examples:     def.Examples,
			Notes:        def.Notes,
			CreatedAt:    def.CreatedAt,
			UpdatedAt:    def.UpdatedAt,
		}
	}

	return entity
}

// ToWordModel converts the entity back to a Word database model
func (w *Word) ToWordModel() *models.Word {
	return &models.Word{
		Id:          w.ID,
		Word:        w.Word,
		Familiarity: w.Familiarity,
		CreatedAt:   w.CreatedAt,
		UpdatedAt:   w.UpdatedAt,
	}
}

// ToDefinitionModels converts the entity definitions to WordDefinition database models
func (w *Word) ToDefinitionModels(wordID int) []*models.WordDefinition {
	definitions := make([]*models.WordDefinition, len(w.Definitions))

	for i, def := range w.Definitions {
		definitions[i] = &models.WordDefinition{
			Id:           def.ID,
			WordId:       wordID,
			PartOfSpeech: def.PartOfSpeech,
			Definition:   def.Definition,
			Phonetics:    def.Phonetics,
			Examples:     def.Examples,
			Notes:        def.Notes,
			CreatedAt:    def.CreatedAt,
			UpdatedAt:    def.UpdatedAt,
		}
	}

	return definitions
}
