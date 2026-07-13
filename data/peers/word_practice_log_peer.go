package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

// WordPracticeLogPeer provides database operations for WordPracticeLog business entities
type WordPracticeLogPeer struct {
	*BasePeer
	tableName string
}

// NewWordPracticeLogPeer creates a new WordPracticeLogPeer instance
func NewWordPracticeLogPeer() (*WordPracticeLogPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &WordPracticeLogPeer{
		BasePeer:  base,
		tableName: schema.WORD_PRACTICE_LOG_TABLE_NAME,
	}, nil
}

// Select retrieves WordPracticeLog records from the database based on the provided criteria
func (wp *WordPracticeLogPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordPracticeLog, error) {
	var logs []*models.WordPracticeLog

	err := wp.db.Select(wp.tableName, columns, where, orderBy, limit, offset, &logs)
	if err != nil {
		return nil, err
	}

	return logs, nil
}

// Insert adds a new WordPracticeLog record to the database
func (wp *WordPracticeLogPeer) Insert(log *models.WordPracticeLog) (int64, error) {
	result, err := wp.db.Insert(wp.tableName, log)
	if err != nil {
		return 0, err
	}

	return result, nil
}
