package peers

import (
	"word-flashcard/data/models"

	"github.com/Masterminds/squirrel"
)

// QuestionAnswerLogPeerInterface defines the database operations for question answer logs.
// This is append-only: only Select and Insert are needed, no Update/Delete.
type QuestionAnswerLogPeerInterface interface {
	Select(columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64) ([]*models.QuestionAnswerLog, error)
	Insert(log *models.QuestionAnswerLog) (int64, error)
}
