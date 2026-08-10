package peers

import (
	"word-flashcard/data/models"
)

// RestorePayload holds a full-fidelity snapshot of every table to be written
// back into the database by RestoreAll, including primary keys and
// timestamps. It mirrors internal/models.DataExport, but peers only ever
// depends on data/models, never internal/models, so callers convert between
// the two at the controller boundary.
type RestorePayload struct {
	Words              []*models.Word
	WordDefinitions    []*models.WordDefinition
	Questions          []*models.Question
	QuestionAnswerLogs []*models.QuestionAnswerLog
	WordPracticeLogs   []*models.WordPracticeLog
	Notes              []*models.Note
}

// BackupPeerInterface defines the database operations needed to fully
// restore the database from an export. Unlike the other peers, RestoreAll
// preserves the original id/created_at/updated_at of every row and replaces
// all existing data, so it operates outside the normal CRUD abstraction
// (see backup_peer.go for why).
type BackupPeerInterface interface {
	RestoreAll(payload *RestorePayload) error
}
