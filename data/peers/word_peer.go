package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

// WordPeer provides database operations for Word business entities
type WordPeer struct {
	*BasePeer
	tableName string
}

// NewWordPeer creates a new WordPeer instance
func NewWordPeer() (*WordPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &WordPeer{
		BasePeer:  base,
		tableName: schema.WORD_TABLE_NAME,
	}, nil
}

// Select retrieves Word records from the database based on the provided criteria
func (wp *WordPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string) ([]*models.Word, error) {
	var words []*models.Word

	// Perform the select operation
	err := wp.db.Select(wp.tableName, columns, where, orderBy, &words)
	if err != nil {
		return nil, err
	}

	return words, nil
}

// Insert adds a new Word record to the database
func (wp *WordPeer) Insert(word *models.Word) (int64, error) {
	// Perform the insert operation
	result, err := wp.db.Insert(wp.tableName, word)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Update modifies an existing Word record in the database
func (wp *WordPeer) Update(word *models.Word, where squirrel.Sqlizer) (int64, error) {
	// Perform the update operation
	result, err := wp.db.Update(wp.tableName, word, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Delete removes Word records from the database based on the provided criteria
func (wp *WordPeer) Delete(where squirrel.Sqlizer) (int64, error) {
	// Perform the delete operation
	result, err := wp.db.Delete(wp.tableName, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}
