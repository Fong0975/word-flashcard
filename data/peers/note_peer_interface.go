package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

type NotePeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Note, error)
	Insert(note *models.Note) (int64, error)
	Update(note *models.Note, where squirrel.Sqlizer) (int64, error)
	Delete(where squirrel.Sqlizer) (int64, error)
	Count() (int64, error)
}
