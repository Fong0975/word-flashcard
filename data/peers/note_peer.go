package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

// NotePeer provides database operations for Note business entities
type NotePeer struct {
	*BasePeer
	tableName string
}

// NewNotePeer creates a new NotePeer instance
func NewNotePeer() (*NotePeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &NotePeer{
		BasePeer:  base,
		tableName: schema.NOTE_TABLE_NAME,
	}, nil
}

// Select retrieves Note records from the database based on the provided criteria
func (np *NotePeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Note, error) {
	var notes []*models.Note

	err := np.db.Select(np.tableName, columns, where, orderBy, limit, offset, &notes)
	if err != nil {
		return nil, err
	}

	return notes, nil
}

// Insert adds a new Note record to the database
func (np *NotePeer) Insert(note *models.Note) (int64, error) {
	result, err := np.db.Insert(np.tableName, note)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Update modifies an existing Note record in the database
func (np *NotePeer) Update(note *models.Note, where squirrel.Sqlizer) (int64, error) {
	result, err := np.db.Update(np.tableName, note, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Delete removes Note records from the database based on the provided criteria
func (np *NotePeer) Delete(where squirrel.Sqlizer) (int64, error) {
	result, err := np.db.Delete(np.tableName, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Count returns the total number of Note records in the database
func (np *NotePeer) Count() (int64, error) {
	result, err := np.db.Count(np.tableName, nil)
	if err != nil {
		return 0, err
	}

	return result, nil
}
