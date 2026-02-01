package peers

import (
	"word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
)

type WordDefinitionsPeer struct {
	*BasePeer
	tableName string
}

func NewWordDefinitionsPeer() (*WordDefinitionsPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	return &WordDefinitionsPeer{
		BasePeer:  base,
		tableName: schema.WORD_DEFINITIONS_TABLE_NAME,
	}, nil
}

// Select retrieves WordDefinition records from the database based on the provided criteria
func (wdp *WordDefinitionsPeer) Select(columns []*string, where squirrel.Sqlizer, orderBy []*string) ([]*models.WordDefinition, error) {
	var definitions []*models.WordDefinition

	// Perform the select operation
	err := wdp.db.Select(wdp.tableName, columns, where, orderBy, &definitions)
	if err != nil {
		return nil, err
	}

	return definitions, nil
}

// Insert adds a new WordDefinition record to the database
func (wdp *WordDefinitionsPeer) Insert(definition *models.WordDefinition) (int64, error) {
	// Perform the insert operation
	result, err := wdp.db.Insert(wdp.tableName, definition)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Update modifies an existing WordDefinition record in the database
func (wdp *WordDefinitionsPeer) Update(definition *models.WordDefinition, where squirrel.Sqlizer) (int64, error) {
	// Perform the update operation
	result, err := wdp.db.Update(wdp.tableName, definition, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}

// Delete removes WordDefinition records from the database based on the provided criteria
func (wdp *WordDefinitionsPeer) Delete(where squirrel.Sqlizer) (int64, error) {
	// Perform the delete operation
	result, err := wdp.db.Delete(wdp.tableName, where)
	if err != nil {
		return 0, err
	}

	return result, nil
}
