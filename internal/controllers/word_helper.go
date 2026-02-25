package controllers

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"

	"github.com/Masterminds/squirrel"
)

// ====================================================================================
// REQUEST PROCESSING GROUP - Handle HTTP request parsing and validation
// ====================================================================================

// parseAndValidateWordRequest parses and validates word data from HTTP request
func (wc *WordController) parseAndValidateWordRequest(c *gin.Context, isUpdate bool) (*models.Word, error) {
	var wordData models.Word
	err := ParseRequestBody(&wordData, c)
	if err != nil {
		return nil, err
	} else if err := validateWordFields(&wordData, isUpdate); err != nil {
		return nil, err
	}

	return &wordData, nil
}

// parseAndValidateWordDefinitionRequest parses and validates word definition data from HTTP request
func (wc *WordController) parseAndValidateWordDefinitionRequest(c *gin.Context, isUpdate bool) (*models.WordDefinition, error) {
	var wordDefinitionData models.WordDefinition
	if err := ParseRequestBody(&wordDefinitionData, c); err != nil {
		return nil, err
	} else if err := validateWordDefinitionFields(wordDefinitionData, isUpdate); err != nil {
		return nil, err
	}

	return &wordDefinitionData, nil
}

// ====================================================================================
// DATA QUERY GROUP - Handle database queries and data fetching
// ====================================================================================

// fetchWordsWithDefinitions queries words with given criteria and includes their definitions
func (wc *WordController) fetchWordsWithDefinitions(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error) {
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
func (wc *WordController) fetchWordDefinitionsForWords(words []*dbModels.Word) ([]*dbModels.WordDefinition, error) {
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
func (wc *WordController) queryWordsByIDsWithPagination(wordIDs []int, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error) {
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
func (wc *WordController) queryWordIDsByTableFilter(filter *models.SearchFilter, isWordDefinitionsTable bool) ([]int, error) {
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

// ====================================================================================
// SEARCH OPERATIONS GROUP - Handle complex search and filtering operations
// ====================================================================================

// parseSearchConditionsByTable separates search conditions based on their target database tables
func parseSearchConditionsByTable(searchFilter *models.SearchFilter) (*models.SearchFilter, *models.SearchFilter, error) {
	if searchFilter.IsEmpty() {
		return nil, nil, nil
	}

	// Define table-specific column mappings
	wordsColumns := map[string]bool{
		schema.WORD_WORD:        true,
		schema.WORD_FAMILIARITY: true,
	}

	wordDefinitionsColumns := map[string]bool{
		schema.WORD_DEFINITIONS_WORD_ID:        true,
		schema.WORD_DEFINITIONS_PART_OF_SPEECH: true,
		schema.WORD_DEFINITIONS_DEFINITION:     true,
		schema.WORD_DEFINITIONS_PHONETICS:      true,
		schema.WORD_DEFINITIONS_EXAMPLES:       true,
		schema.WORD_DEFINITIONS_NOTES:          true,
	}

	var wordsConditions []models.SearchCondition
	var wordDefsConditions []models.SearchCondition

	// Categorize conditions by target table
	for _, condition := range searchFilter.Conditions {
		if wordsColumns[condition.Key] {
			wordsConditions = append(wordsConditions, condition)
		} else if wordDefinitionsColumns[condition.Key] {
			wordDefsConditions = append(wordDefsConditions, condition)
		} else {
			return nil, nil, fmt.Errorf("unknown column: %s", condition.Key)
		}
	}

	// Create separate filters for each table
	var wordsFilter, wordDefsFilter *models.SearchFilter

	if len(wordsConditions) > 0 {
		wordsFilter = &models.SearchFilter{
			Conditions: wordsConditions,
			Logic:      searchFilter.Logic,
		}
	}

	if len(wordDefsConditions) > 0 {
		wordDefsFilter = &models.SearchFilter{
			Conditions: wordDefsConditions,
			Logic:      searchFilter.Logic,
		}
	}

	return wordsFilter, wordDefsFilter, nil
}

// executeComplexWordSearch performs comprehensive word search across multiple tables with logic combination
func (wc *WordController) executeComplexWordSearch(searchFilter *models.SearchFilter) ([]int, error) {
	// Separate conditions by target tables
	wordsFilter, wordDefsFilter, err := parseSearchConditionsByTable(searchFilter)
	if err != nil {
		return nil, err
	}

	// Query each table to get matching word IDs
	wordsIDs, err := wc.queryWordIDsByTableFilter(wordsFilter, false)
	if err != nil {
		return nil, err
	}

	wordDefsIDs, err := wc.queryWordIDsByTableFilter(wordDefsFilter, true)
	if err != nil {
		return nil, err
	}

	// Combine results based on specified logic operator
	return wc.combineWordIDsWithLogic(wordsIDs, wordDefsIDs, searchFilter.Logic), nil
}

// countWordsMatchingFilter counts total number of words that match the search filter criteria
func (wc *WordController) countWordsMatchingFilter(searchFilter *models.SearchFilter) (int64, error) {
	// Handle empty search filter case
	if searchFilter.IsEmpty() {
		return wc.wordPeer.Count(nil)
	}

	// Execute search to get matching word IDs
	matchingWordIDs, err := wc.executeComplexWordSearch(searchFilter)
	if err != nil {
		return 0, err
	}

	// Return count of unique word IDs
	return int64(len(matchingWordIDs)), nil
}

// ====================================================================================
// DATA TRANSFORMATION GROUP - Handle model conversions and data mapping
// ====================================================================================

// transformToWordEntities converts database models to API models with proper associations
func (wc *WordController) transformToWordEntities(words []*dbModels.Word, wordsDefs []*dbModels.WordDefinition) []*models.Word {
	var wordEntities []*models.Word
	for _, word := range words {
		// Collect all definitions belonging to current word
		var defsForWord []*dbModels.WordDefinition
		for _, def := range wordsDefs {
			if *def.WordId == *word.Id {
				defsForWord = append(defsForWord, def)
			}
		}

		// Create API model from database models
		wordEntity := new(models.Word).FromDataModel(word, defsForWord)
		wordEntities = append(wordEntities, wordEntity)
	}

	return wordEntities
}

// ====================================================================================
// VALIDATION GROUP - Handle field validation and data integrity
// ====================================================================================

// validateWordFields validates word entity fields including business rules and constraints
func validateWordFields(wordData *models.Word, isUpdate bool) error {
	// Validate word field: VARCHAR(255), NOT NULL for creation
	if !isUpdate && (wordData.Word == nil || *wordData.Word == "") {
		return errors.New("word is invalid")
	} else if wordData.Word != nil && len(*wordData.Word) > 255 {
		return errors.New("word is invalid")
	}

	// Validate familiarity enum values
	validFamiliarity := []string{schema.WORD_FAMILIARITY_RED, schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN}
	if wordData.Familiarity != nil && !slices.Contains(validFamiliarity, *wordData.Familiarity) {
		return errors.New("familiarity is invalid")
	}

	return nil
}

// validateWordDefinitionFields validates word definition entity fields including constraints
func validateWordDefinitionFields(definition models.WordDefinition, isUpdate bool) error {
	// Validate part_of_speech field: VARCHAR(50), required for creation
	if !isUpdate && (definition.PartOfSpeech == nil || *definition.PartOfSpeech == "") {
		return errors.New("part_of_speech is invalid")
	} else if definition.PartOfSpeech != nil && len(*definition.PartOfSpeech) > 50 {
		return errors.New("part_of_speech is invalid")
	}

	// Validate definition field: TEXT, NOT NULL for creation
	if !isUpdate && (definition.Definition == nil || *definition.Definition == "") {
		return errors.New("definition is invalid")
	} else if definition.Definition != nil && len(*definition.Definition) > 21845 {
		return errors.New("definition is invalid")
	}

	// Validate phonetics field: TEXT, nullable
	if definition.Phonetics != nil && len(*definition.Phonetics) > 21845 {
		return errors.New("phonetics is invalid")
	}

	// Validate examples field: TEXT, nullable
	if definition.Examples != nil && len(*definition.Examples) > 21845 {
		return errors.New("examples is invalid")
	}

	return nil
}

// ====================================================================================
// UTILITY OPERATIONS GROUP - Handle data processing utilities and helper algorithms
// ====================================================================================

// combineWordIDsWithLogic combines word ID sets from different sources using specified logical operator
func (wc *WordController) combineWordIDsWithLogic(wordsIDs, wordDefsIDs []int, logic string) []int {
	// Handle edge cases where one set is empty
	if len(wordsIDs) == 0 {
		return wordDefsIDs
	}
	if len(wordDefsIDs) == 0 {
		return wordsIDs
	}

	logicUpper := strings.ToUpper(logic)

	if logicUpper == "AND" {
		// Intersection: return only IDs that exist in both sets
		return wc.intersectIDLists(wordsIDs, wordDefsIDs)
	} else {
		// Union: return IDs that exist in either set (OR logic)
		return wc.unionIDLists(wordsIDs, wordDefsIDs)
	}
}

// intersectIDLists returns intersection of two ID lists (elements present in both lists)
func (wc *WordController) intersectIDLists(slice1, slice2 []int) []int {
	set2 := make(map[int]bool)
	for _, id := range slice2 {
		set2[id] = true
	}

	var result []int
	for _, id := range slice1 {
		if set2[id] {
			result = append(result, id)
		}
	}

	return result
}

// unionIDLists returns union of two ID lists (elements from both lists, no duplicates)
func (wc *WordController) unionIDLists(slice1, slice2 []int) []int {
	seen := make(map[int]bool)
	var result []int

	// Add elements from first slice
	for _, id := range slice1 {
		if !seen[id] {
			result = append(result, id)
			seen[id] = true
		}
	}

	// Add unique elements from second slice
	for _, id := range slice2 {
		if !seen[id] {
			result = append(result, id)
			seen[id] = true
		}
	}

	return result
}
