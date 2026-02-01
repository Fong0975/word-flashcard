package controllers

import (
	"errors"
	"fmt"
	"slices"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"

	"github.com/Masterminds/squirrel"
)

// queryWord is a helper function to query words with given criteria
func (wc *WordController) queryWord(columns []*string, where squirrel.Sqlizer, orderBy []*string) ([]*models.Word, error) {
	// ============== 1. Query 'words' table ================
	// Query 'words' table
	words, err := wc.wordPeer.Select(columns, where, orderBy)
	if err != nil {
		return nil, err
	}

	// Query 'word_definitions' table
	wordsDefs, err := wc.getWordDefinitionsByWords(words)
	if err != nil {
		return nil, err
	}

	// ================ 2. Transform data to API model ================
	return convertToEntities(words, wordsDefs), nil
}

// getWordDefinitionsByWords fetches word definitions for the given words
func (wc *WordController) getWordDefinitionsByWords(words []*dbModels.Word) ([]*dbModels.WordDefinition, error) {
	// Extract word IDs
	var wordIDs []int
	for _, word := range words {
		wordIDs = append(wordIDs, *word.Id)
	}

	// Query 'word_definitions' table
	whereDefs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: wordIDs}
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_ID)
	wordsDefs, err := wc.wordDefinitionPeer.Select([]*string{}, whereDefs, []*string{&orderBy})
	if err != nil {
		return nil, err
	}

	return wordsDefs, nil
}

// getAndValidateRequestedWord fetches and validates word data from the request
func (wc *WordController) getAndValidateRequestedWord(c *gin.Context, isUpdate bool) (*models.Word, error) {
	var wordData models.Word
	err := ParseRequestBody(&wordData, c)
	if err != nil {
		return nil, err
	} else if err := validateWordFields(&wordData, isUpdate); err != nil {
		return nil, err
	}

	return &wordData, nil
}

// getAndValidateRequestedWordDefinitions fetches and validates word definition data from the request
func (wc *WordController) getAndValidateRequestedWordDefinitions(c *gin.Context, isUpdate bool) (*models.WordDefinition, error) {
	var wordDefinitionData models.WordDefinition
	if err := ParseRequestBody(&wordDefinitionData, c); err != nil {
		return nil, err
	} else if err := validateWordDefinitionFields(wordDefinitionData, isUpdate); err != nil {
		return nil, err
	}

	return &wordDefinitionData, nil
}

// convertToEntities converts database models to API models
func convertToEntities(words []*dbModels.Word, wordsDefs []*dbModels.WordDefinition) []*models.Word {
	var wordEntities []*models.Word
	for _, word := range words {
		// Collect definitions for the current word
		var defsForWord []*dbModels.WordDefinition
		for _, def := range wordsDefs {
			if *def.WordId == *word.Id {
				defsForWord = append(defsForWord, def)
			}
		}

		wordEntity := new(models.Word).FromDataModel(word, defsForWord)
		wordEntities = append(wordEntities, wordEntity)
	}

	return wordEntities
}

// validateWordFields validates word and familiarity fields
func validateWordFields(wordData *models.Word, isUpdate bool) error {
	// word field: VARCHAR(255), NOT NULL
	if !isUpdate && (wordData.Word == nil || *wordData.Word == "") {
		return errors.New("word is invalid")
	} else if wordData.Word != nil && len(*wordData.Word) > 255 {
		return errors.New("word is invalid")
	}

	listFamiliarity := []string{schema.WORD_FAMILIARITY_RED, schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN}
	if wordData.Familiarity != nil && !slices.Contains(listFamiliarity, *wordData.Familiarity) {
		return errors.New("familiarity is invalid")
	}

	return nil
}

// validateWordDefinitionFields validates all word definitions
func validateWordDefinitionFields(definition models.WordDefinition, isUpdate bool) error {
	// part_of_speech field: VARCHAR(50), nullable
	if !isUpdate && (definition.PartOfSpeech == nil || *definition.PartOfSpeech == "") {
		return errors.New("part_of_speech is invalid")
	} else if definition.PartOfSpeech != nil && len(*definition.PartOfSpeech) > 50 {
		return errors.New("part_of_speech is invalid")
	}

	// definition field: TEXT, NOT NULL
	if !isUpdate && (definition.Definition == nil || *definition.Definition == "") {
		return errors.New("definition is invalid")
	} else if definition.Definition != nil && len(*definition.Definition) > 21845 {
		return errors.New("definition is invalid")
	}

	// phonetics field: TEXT, nullable
	if definition.Phonetics != nil && len(*definition.Phonetics) > 21845 {
		return errors.New("phonetics is invalid")
	}

	// examples field: TEXT, nullable
	if definition.Examples != nil && len(*definition.Examples) > 21845 {
		return errors.New("examples is invalid")
	}

	return nil
}
