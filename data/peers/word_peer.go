package peers

import (
	"database/sql"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"word-flashcard/data/entities"
	"word-flashcard/data/models"
)

// WordPeer provides database operations for Word business entities
type WordPeer struct {
	*BasePeer
}

// NewWordPeer creates a new WordPeer instance
func NewWordPeer() (*WordPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &WordPeer{
		BasePeer: base,
	}, nil
}

// Insert adds a new complete word entity to the database
// Input: entities object -> Split into word and definitions -> Insert each to database
func (wp *WordPeer) Insert(wordEntity *entities.Word) error {
	// Start transaction
	tx, err := wp.GetDB().Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func(tx *sql.Tx) {
		err := tx.Rollback()
		if err != nil {
			slog.Error("failed to rollback transaction", "error", err)
		}
	}(tx)

	// 1. Prepare and insert word data
	wordModel := wordEntity.ToWordModel()
	now := time.Now()
	if wordModel.CreatedAt.IsZero() {
		wordModel.CreatedAt = now
	}
	if wordModel.UpdatedAt.IsZero() {
		wordModel.UpdatedAt = now
	}
	if wordModel.Familiarity == "" {
		wordModel.Familiarity = "RED"
	}

	wordQuery := `INSERT INTO words (word, familiarity, created_at, updated_at) VALUES (?, ?, ?, ?)`
	wordResult, err := tx.Exec(
		wordQuery,
		wordModel.Word,
		wordModel.Familiarity,
		wordModel.CreatedAt,
		wordModel.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert word: %w", err)
	}

	wordID, err := wordResult.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get inserted word ID: %w", err)
	}

	// Update entity ID
	wordEntity.ID = int(wordID)

	// 2. Insert all definitions
	for _, definition := range wordEntity.Definitions {
		defModel := &models.WordDefinition{
			WordId:       int(wordID),
			PartOfSpeech: definition.PartOfSpeech,
			Definition:   definition.Definition,
			Phonetics:    definition.Phonetics,
			Examples:     definition.Examples,
			Notes:        definition.Notes,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		defQuery := `INSERT INTO word_definitions
					 (word_id, part_of_speech, definition, phonetics, examples, notes, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		defResult, err := tx.Exec(defQuery,
			defModel.WordId,
			defModel.PartOfSpeech,
			defModel.Definition,
			defModel.Phonetics,
			defModel.Examples,
			defModel.Notes,
			defModel.CreatedAt,
			defModel.UpdatedAt)

		if err != nil {
			return fmt.Errorf("failed to insert definition: %w", err)
		}

		defID, err := defResult.LastInsertId()
		if err != nil {
			return fmt.Errorf("failed to get definition ID: %w", err)
		}

		definition.ID = int(defID)
		definition.CreatedAt = now
		definition.UpdatedAt = now
	}

	// Commit transaction
	return tx.Commit()
}

// Select retrieves word entities based on conditions
// Query conditions -> Query words first -> Query definitions by ID -> Combine into entities objects
func (wp *WordPeer) Select(conditions map[string]interface{}, limit int, offset int) ([]*entities.Word, error) {
	// 1. Query words that match conditions
	wordModels, err := wp.queryWords(conditions, limit, offset)
	if err != nil {
		return nil, err
	}

	if len(wordModels) == 0 {
		return []*entities.Word{}, nil
	}

	// 2. Batch query definitions for these words
	wordIDs := make([]interface{}, len(wordModels))
	for i, word := range wordModels {
		wordIDs[i] = word.Id
	}

	definitionsMap, err := wp.queryDefinitionsByWordIDs(wordIDs)
	if err != nil {
		return nil, err
	}

	// 3. Combine into entities objects
	var wordEntities []*entities.Word
	for _, wordModel := range wordModels {
		definitions := definitionsMap[wordModel.Id]
		wordEntity := entities.FromModels(wordModel, definitions)
		wordEntities = append(wordEntities, wordEntity)
	}

	return wordEntities, nil
}

// queryWords queries word models that match conditions
func (wp *WordPeer) queryWords(conditions map[string]interface{}, limit int, offset int) ([]*models.Word, error) {
	query := "SELECT id, word, familiarity, created_at, updated_at FROM words"
	args := []interface{}{}

	// Build WHERE clause
	if len(conditions) > 0 {
		whereClauses := []string{}
		for column, value := range conditions {
			whereClauses = append(whereClauses, fmt.Sprintf("%s = ?", column))
			args = append(args, value)
		}
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Add LIMIT and OFFSET
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
		if offset > 0 {
			query += fmt.Sprintf(" OFFSET %d", offset)
		}
	}

	rows, err := wp.GetDB().Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query words: %w", err)
	}
	defer rows.Close()

	var words []*models.Word
	for rows.Next() {
		word := &models.Word{}
		if err := rows.Scan(&word.Id, &word.Word, &word.Familiarity, &word.CreatedAt, &word.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan word: %w", err)
		}
		words = append(words, word)
	}

	return words, rows.Err()
}

// queryDefinitionsByWordIDs batch queries definitions for multiple words, returns map[wordID][]*models.WordDefinition
func (wp *WordPeer) queryDefinitionsByWordIDs(wordIDs []interface{}) (map[int][]*models.WordDefinition, error) {
	if len(wordIDs) == 0 {
		return make(map[int][]*models.WordDefinition), nil
	}

	// Build IN query
	placeholders := strings.Repeat("?,", len(wordIDs))
	placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

	query := fmt.Sprintf(`SELECT id, word_id, part_of_speech, definition, phonetics, examples, notes,
						  created_at, updated_at
						  FROM word_definitions
						  WHERE word_id IN (%s)
						  ORDER BY word_id, id`, placeholders)

	rows, err := wp.GetDB().Query(query, wordIDs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query definitions: %w", err)
	}
	defer rows.Close()

	definitionsMap := make(map[int][]*models.WordDefinition)
	for rows.Next() {
		def := &models.WordDefinition{}
		if err := rows.Scan(
			&def.Id,
			&def.WordId,
			&def.PartOfSpeech,
			&def.Definition,
			&def.Phonetics,
			&def.Examples,
			&def.Notes,
			&def.CreatedAt,
			&def.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan definition: %w", err)
		}

		definitionsMap[def.WordId] = append(definitionsMap[def.WordId], def)
	}

	return definitionsMap, rows.Err()
}

// SelectByID retrieves a word entity by its ID
func (wp *WordPeer) SelectByID(id int) (*entities.Word, error) {
	words, err := wp.Select(map[string]interface{}{"id": id}, 1, 0)
	if err != nil {
		return nil, err
	}

	if len(words) == 0 {
		return nil, sql.ErrNoRows
	}

	return words[0], nil
}

// SelectByWord retrieves a word entity by its word text
func (wp *WordPeer) SelectByWord(wordText string) (*entities.Word, error) {
	words, err := wp.Select(map[string]interface{}{"word": wordText}, 1, 0)
	if err != nil {
		return nil, err
	}

	if len(words) == 0 {
		return nil, sql.ErrNoRows
	}

	return words[0], nil
}

// Update updates an existing word entity (word + all definitions)
func (wp *WordPeer) Update(wordEntity *entities.Word) error {
	// Start transaction
	tx, err := wp.GetDB().Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func(tx *sql.Tx) {
		err := tx.Rollback()
		if err != nil {
			slog.Error("failed to rollback transaction", "error", err)
		}
	}(tx)

	// 1. Update word
	wordModel := wordEntity.ToWordModel()
	wordModel.UpdatedAt = time.Now()

	wordQuery := `UPDATE words SET word = ?, familiarity = ?, updated_at = ? WHERE id = ?`
	result, err := tx.Exec(wordQuery, wordModel.Word, wordModel.Familiarity, wordModel.UpdatedAt, wordModel.Id)
	if err != nil {
		return fmt.Errorf("failed to update word: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	// 2. Delete existing definitions
	_, err = tx.Exec("DELETE FROM word_definitions WHERE word_id = ?", wordEntity.ID)
	if err != nil {
		return fmt.Errorf("failed to delete existing definitions: %w", err)
	}

	// 3. Insert new definitions
	now := time.Now()
	for _, definition := range wordEntity.Definitions {
		defQuery := `INSERT INTO word_definitions
					 (word_id, part_of_speech, definition, phonetics, examples, notes, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		defResult, err := tx.Exec(defQuery,
			wordEntity.ID,
			definition.PartOfSpeech,
			definition.Definition,
			definition.Phonetics,
			definition.Examples,
			definition.Notes,
			now,
			now)

		if err != nil {
			return fmt.Errorf("failed to insert definition: %w", err)
		}

		// Update definition ID
		defID, err := defResult.LastInsertId()
		if err != nil {
			return fmt.Errorf("failed to get definition ID: %w", err)
		}

		definition.ID = int(defID)
		definition.CreatedAt = now
		definition.UpdatedAt = now
	}

	// Update wordEntity timestamp
	wordEntity.UpdatedAt = wordModel.UpdatedAt

	return tx.Commit()
}

// Delete removes a word entity and all its definitions
func (wp *WordPeer) Delete(id int) error {
	// Start transaction
	tx, err := wp.GetDB().Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func(tx *sql.Tx) {
		err := tx.Rollback()
		if err != nil {
			slog.Error("failed to rollback transaction", "error", err)
		}
	}(tx)

	// 1. Delete definitions first (due to foreign key constraint)
	_, err = tx.Exec("DELETE FROM word_definitions WHERE word_id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete word definitions: %w", err)
	}

	// 2. Delete word
	result, err := tx.Exec("DELETE FROM words WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete word: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

// Count returns the total number of words matching the conditions
func (wp *WordPeer) Count(conditions map[string]interface{}) (int, error) {
	query := "SELECT COUNT(*) FROM words"
	args := []interface{}{}

	// Build WHERE clause
	if len(conditions) > 0 {
		whereClauses := []string{}
		for column, value := range conditions {
			whereClauses = append(whereClauses, fmt.Sprintf("%s = ?", column))
			args = append(args, value)
		}
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var count int
	err := wp.GetDB().QueryRow(query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count words: %w", err)
	}

	return count, nil
}
