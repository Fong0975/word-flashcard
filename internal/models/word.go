package models

import (
	"encoding/json"
	"log/slog"
	"word-flashcard/data/models"
	"word-flashcard/utils"
)

// WordDefinition represents a word definition used in both requests and responses
type WordDefinition struct {
	ID           *int                    `json:"id,omitempty"`
	PartOfSpeech *string                 `json:"part_of_speech,omitempty"`
	Definition   *string                 `json:"definition,omitempty"`
	Phonetics    *map[string]interface{} `json:"phonetics"`
	Examples     *[]string               `json:"examples"`
	Notes        *string                 `json:"notes"`
}

// Word represents a word that can be used in both API requests and responses
type Word struct {
	ID          *int             `json:"id,omitempty"`
	Word        *string          `json:"word,omitempty"`
	Familiarity *string          `json:"familiarity,omitempty"`
	Definitions []WordDefinition `json:"definitions"`
}

// FromDataModel converts a data model Word and its definitions to the API model Word
func (w *Word) FromDataModel(dm *models.Word, defs []*models.WordDefinition) *Word {
	w.ID = dm.Id
	w.Word = dm.Word
	w.Familiarity = dm.Familiarity

	if len(defs) == 0 {
		w.Definitions = []WordDefinition{}
		return w
	}

	var wordDefs []WordDefinition
	for _, def := range defs {
		// Convert phonetics from JSON string to map[string]
		var phonetics map[string]interface{}
		if def.Phonetics != nil {
			cleanPhonetics := utils.CleanJSONString(*def.Phonetics)
			err := json.Unmarshal([]byte(cleanPhonetics), &phonetics)
			if err != nil {
				slog.Warn("Failed to unmarshal phonetics JSON", "error", err)
			}
		} else {
			phonetics = map[string]interface{}{}
		}

		// Convert examples from JSON string to []string
		var examples []string
		if def.Examples != nil {
			cleanExamples := utils.CleanJSONString(*def.Examples)
			err := json.Unmarshal([]byte(cleanExamples), &examples)
			if err != nil {
				slog.Warn("Failed to unmarshal examples JSON", "error", err)
			}
		} else {
			examples = []string{}
		}

		var notes string
		if def.Notes != nil {
			notes = *def.Notes
		} else {
			notes = ""
		}

		wordDef := WordDefinition{
			ID:           def.Id,
			PartOfSpeech: def.PartOfSpeech,
			Definition:   def.Definition,
			Phonetics:    &phonetics,
			Examples:     &examples,
			Notes:        &notes,
		}
		wordDefs = append(wordDefs, wordDef)
	}
	w.Definitions = wordDefs

	return w
}

// ToDataModel converts the API model Word to the data model Word
func (w *Word) ToDataModel() *models.Word {
	// Convert Word to data model
	return &models.Word{
		Id:          w.ID,
		Word:        w.Word,
		Familiarity: w.Familiarity,
	}
}

// ToDataModel converts the API model WordDefinition to the data model WordDefinition
func (wd *WordDefinition) ToDataModel() *models.WordDefinition {
	// Convert phonetics from map[string]interface{} to JSON string
	var phoneticsStr *string
	if wd.Phonetics != nil {
		phoneticsBytes, err := json.Marshal(wd.Phonetics)
		if err != nil {
			slog.Warn("Failed to marshal phonetics to JSON", "error", err)
		} else {
			phonetics := string(phoneticsBytes)
			phoneticsStr = &phonetics
		}
	}

	// Convert examples from []string to JSON string
	var examplesStr *string
	if wd.Examples != nil {
		examplesBytes, err := json.Marshal(wd.Examples)
		if err != nil {
			slog.Warn("Failed to marshal examples to JSON", "error", err)
		} else {
			examples := string(examplesBytes)
			examplesStr = &examples
		}
	}

	return &models.WordDefinition{
		Id:           wd.ID,
		PartOfSpeech: wd.PartOfSpeech,
		Definition:   wd.Definition,
		Phonetics:    phoneticsStr,
		Examples:     examplesStr,
		Notes:        wd.Notes,
	}
}

// RandomFilter represents the request structure for random word selection
type RandomFilter struct {
	Count  int           `json:"count" binding:"required,min=1,max=1000"`
	Filter *SearchFilter `json:"filter,omitempty"`
}
