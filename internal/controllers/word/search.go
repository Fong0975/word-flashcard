package word

import (
	"fmt"
	"strings"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
)

// parseSearchConditionsByTable separates search conditions based on their target database tables
func parseSearchConditionsByTable(searchFilter *models.SearchFilter) (*models.SearchFilter, *models.SearchFilter, error) {
	if searchFilter.IsEmpty() {
		return nil, nil, nil
	}

	// Define table-specific column mappings
	wordsColumns := map[string]bool{
		schema.WORD_WORD:        true,
		schema.WORD_FAMILIARITY: true,
		schema.WORD_REMINDER:    true,
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
func (wc *Controller) executeComplexWordSearch(searchFilter *models.SearchFilter) ([]int, error) {
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
func (wc *Controller) countWordsMatchingFilter(searchFilter *models.SearchFilter) (int64, error) {
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

// combineWordIDsWithLogic combines word ID sets from different sources using specified logical operator
func (wc *Controller) combineWordIDsWithLogic(wordsIDs, wordDefsIDs []int, logic string) []int {
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
func (wc *Controller) intersectIDLists(slice1, slice2 []int) []int {
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
func (wc *Controller) unionIDLists(slice1, slice2 []int) []int {
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
