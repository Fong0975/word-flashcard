package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

// WordPracticeLogPeerInterface defines the database operations for word practice logs.
// This is append-only: only Select and Insert are needed, no Update/Delete.
type WordPracticeLogPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordPracticeLog, error)
	Insert(log *models.WordPracticeLog) (int64, error)
}
