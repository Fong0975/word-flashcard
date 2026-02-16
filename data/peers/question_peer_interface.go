package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

type QuestionPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Question, error)
	Insert(question *models.Question) (int64, error)
	Update(question *models.Question, where squirrel.Sqlizer) (int64, error)
	Delete(where squirrel.Sqlizer) (int64, error)
	Count() (int64, error)
}
