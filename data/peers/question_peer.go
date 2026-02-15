package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

// QuestionPeer provides database operations for Question business entities
type QuestionPeer struct {
	*BasePeer
	tableName string
}

// NewQuestionPeer creates a new QuestionPeer instance
func NewQuestionPeer() (*QuestionPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &QuestionPeer{
		BasePeer:  base,
		tableName: schema.QUESTION_TABLE_NAME,
	}, nil
}

// Select retrieves Question records from the database based on the provided criteria
func (qp *QuestionPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Question, error) {
	var questions []*models.Question

	// Perform the select operation
	err := qp.db.Select(qp.tableName, columns, where, orderBy, limit, offset, &questions)
	if err != nil {
		return nil, err
	}

	return questions, nil
}

// Insert adds a new Question record to the database
func (qp *QuestionPeer) Insert(question *models.Question) (int64, error) {
	// Perform the insert operation
	result, err := qp.db.Insert(qp.tableName, question)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Update modifies an existing Question record in the database
func (qp *QuestionPeer) Update(question *models.Question, where squirrel.Sqlizer) (int64, error) {
	// Perform the update operation
	result, err := qp.db.Update(qp.tableName, question, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Delete removes Question records from the database based on the provided criteria
func (qp *QuestionPeer) Delete(where squirrel.Sqlizer) (int64, error) {
	// Perform the delete operation
	result, err := qp.db.Delete(qp.tableName, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}
