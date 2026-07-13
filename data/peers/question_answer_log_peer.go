package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

// QuestionAnswerLogPeer provides database operations for QuestionAnswerLog business entities
type QuestionAnswerLogPeer struct {
	*BasePeer
	tableName string
}

// NewQuestionAnswerLogPeer creates a new QuestionAnswerLogPeer instance
func NewQuestionAnswerLogPeer() (*QuestionAnswerLogPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &QuestionAnswerLogPeer{
		BasePeer:  base,
		tableName: schema.QUESTION_ANSWER_LOG_TABLE_NAME,
	}, nil
}

// Select retrieves QuestionAnswerLog records from the database based on the provided criteria
func (qp *QuestionAnswerLogPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.QuestionAnswerLog, error) {
	var logs []*models.QuestionAnswerLog

	err := qp.db.Select(qp.tableName, columns, where, orderBy, limit, offset, &logs)
	if err != nil {
		return nil, err
	}

	return logs, nil
}

// Insert adds a new QuestionAnswerLog record to the database
func (qp *QuestionAnswerLogPeer) Insert(log *models.QuestionAnswerLog) (int64, error) {
	result, err := qp.db.Insert(qp.tableName, log)
	if err != nil {
		return 0, err
	}

	return result, nil
}
