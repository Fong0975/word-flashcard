package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

type WordDefinitionsPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordDefinition, error)
	Insert(definition *models.WordDefinition) (int64, error)
	Update(definition *models.WordDefinition, where squirrel.Sqlizer) (int64, error)
	Delete(where squirrel.Sqlizer) (int64, error)
}
