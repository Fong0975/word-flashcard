package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

// WordPeerInterface defines the interface for WordPeer
type WordPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.Word, error)
	Insert(word *models.Word) (int64, error)
	Update(word *models.Word, where squirrel.Sqlizer) (int64, error)
	Delete(where squirrel.Sqlizer) (int64, error)
	Count(where squirrel.Sqlizer) (int64, error)
}
