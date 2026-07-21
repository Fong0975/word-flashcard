package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

// WordPracticeLogPeerInterface defines the database operations for word practice logs.
// Logs are otherwise append-only (no Delete); Update exists solely to correct
// a log row when the user resubmits a familiarity for the same word within
// the same quiz session (see UpdateWord).
type WordPracticeLogPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.WordPracticeLog, error)
	Insert(log *models.WordPracticeLog) (int64, error)
	Update(log *models.WordPracticeLog, where squirrel.Sqlizer) (int64, error)
}
