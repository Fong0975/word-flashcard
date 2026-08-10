package models

import (
	"time"

	"word-flashcard/data/models"
)

// DataExport is a full-fidelity snapshot of every table in the database,
// including primary keys and timestamps. It is used as both the response
// body of GET /api/data/export and the request body of POST /api/data/import,
// so a round trip through Export -> Import restores the database to an
// identical state (same ids, same created_at/updated_at).
//
// An empty table serializes as JSON `null` (Go's zero value for a slice),
// exactly as if the key were omitted entirely; import treats both the same
// way as an explicit empty list: restore that table to empty.
type DataExport struct {
	ExportedAt         time.Time                   `json:"exported_at"`
	Words              []*models.Word              `json:"words"`
	WordDefinitions    []*models.WordDefinition    `json:"word_definitions"`
	Questions          []*models.Question          `json:"questions"`
	QuestionAnswerLogs []*models.QuestionAnswerLog `json:"question_answer_logs"`
	WordPracticeLogs   []*models.WordPracticeLog   `json:"word_practice_logs"`
	Notes              []*models.Note              `json:"notes"`
}

// ImportSummary reports how many rows were written to each table by a
// completed POST /api/data/import restore.
type ImportSummary struct {
	Words              int `json:"words"`
	WordDefinitions    int `json:"word_definitions"`
	Questions          int `json:"questions"`
	QuestionAnswerLogs int `json:"question_answer_logs"`
	WordPracticeLogs   int `json:"word_practice_logs"`
	Notes              int `json:"notes"`
}
