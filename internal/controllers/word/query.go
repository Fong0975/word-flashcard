package word

import (
	"fmt"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
)

// fetchWordsWithDefinitions queries words with given criteria and includes their definitions
func (wc *Controller) fetchWordsWithDefinitions(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error) {
	// Query words table
	words, err := wc.wordPeer.Select(columns, where, orderBy, limit, offset)
	if err != nil {
		return nil, err
	}

	// Fetch associated word definitions
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		return nil, err
	}

	// Transform to API models
	return wc.transformToWordEntities(words, wordsDefs), nil
}

// fetchWordDefinitionsForWords retrieves word definitions for a given set of words
func (wc *Controller) fetchWordDefinitionsForWords(words []*dbModels.Word) ([]*dbModels.WordDefinition, error) {
	// Extract word IDs from word models
	var wordIDs []int
	for _, word := range words {
		wordIDs = append(wordIDs, *word.Id)
	}

	// Query word_definitions table using word IDs
	whereDefs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: wordIDs}
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_ID)
	wordsDefs, err := wc.wordDefinitionPeer.Select([]*string{}, whereDefs, []*string{&orderBy}, nil, nil)
	if err != nil {
		return nil, err
	}

	return wordsDefs, nil
}

// queryWordsByIDsWithPagination queries words and their definitions by specific word IDs with pagination support
func (wc *Controller) queryWordsByIDsWithPagination(wordIDs []int, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error) {
	if len(wordIDs) == 0 {
		return []*models.Word{}, nil
	}

	// Query words table by IDs
	where := squirrel.Eq{schema.WORD_ID: wordIDs}
	words, err := wc.wordPeer.Select([]*string{}, where, orderBy, limit, offset)
	if err != nil {
		return nil, err
	}

	// Fetch word definitions for these words
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		return nil, err
	}

	// Transform to API models
	return wc.transformToWordEntities(words, wordsDefs), nil
}

// queryWordIDsByTableFilter queries specific table to get word IDs matching the filter
func (wc *Controller) queryWordIDsByTableFilter(filter *models.SearchFilter, isWordDefinitionsTable bool) ([]int, error) {
	if filter == nil {
		return nil, nil
	}

	where, err := filter.ToSqlizer()
	if err != nil {
		return nil, err
	}

	var wordIDs []int

	if isWordDefinitionsTable {
		// Query word_definitions table
		wordDefs, err := wc.wordDefinitionPeer.Select(nil, where, nil, nil, nil)
		if err != nil {
			return nil, err
		}

		// Extract unique word IDs (avoid duplicates)
		seenIDs := make(map[int]bool)
		for _, wordDef := range wordDefs {
			if !seenIDs[*wordDef.WordId] {
				wordIDs = append(wordIDs, *wordDef.WordId)
				seenIDs[*wordDef.WordId] = true
			}
		}
	} else {
		// Query words table
		words, err := wc.wordPeer.Select(nil, where, nil, nil, nil)
		if err != nil {
			return nil, err
		}

		// Extract word IDs
		for _, word := range words {
			wordIDs = append(wordIDs, *word.Id)
		}
	}

	return wordIDs, nil
}
