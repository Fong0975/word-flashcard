package peers

import (
	"errors"
	"testing"
	"time"

	"word-flashcard/data/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/suite"
)

// backupPeerTestSuite is a test suite for BackupPeer
type backupPeerTestSuite struct {
	suite.Suite
}

// TestBackupPeerSuite runs the backupPeerTestSuite
func TestBackupPeerSuite(t *testing.T) {
	suite.Run(t, new(backupPeerTestSuite))
}

// TestPlaceholderFormat verifies the SQL placeholder style chosen per DB type
func (s *backupPeerTestSuite) TestPlaceholderFormat() {
	tests := []struct {
		name           string
		dbType         string
		wantPlaceholder string
	}{
		{name: "mysql uses question marks", dbType: "mysql", wantPlaceholder: "?"},
		{name: "postgresql uses dollar placeholders", dbType: "postgresql", wantPlaceholder: "$1"},
		{name: "unknown type defaults to question marks", dbType: "sqlite", wantPlaceholder: "?"},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			pf := placeholderFormat(tt.dbType)

			sqlStr, _, err := squirrel.Insert("t").Columns("a").Values(1).PlaceholderFormat(pf).ToSql()
			s.Require().NoError(err)
			s.Contains(sqlStr, tt.wantPlaceholder)
		})
	}
}

// TestAllColumnsWithValues verifies data/models rows are converted into
// their full column list (including id/created_at/updated_at, unlike
// utils/database's own struct-to-map conversion) and value list.
func (s *backupPeerTestSuite) TestAllColumnsWithValues() {
	id := 1
	word := "apple"

	tests := []struct {
		name        string
		input       interface{}
		wantColumns []string
		wantErr     bool
	}{
		{
			name:  "pointer to struct with mixed nil/non-nil fields",
			input: &models.Word{Id: &id, Word: &word},
			wantColumns: []string{
				"id", "word", "familiarity", "reminder",
				"count_practise", "last_practiced_at", "created_at", "updated_at",
			},
		},
		{
			name:    "nil pointer returns error",
			input:   (*models.Word)(nil),
			wantErr: true,
		},
		{
			name:    "non-struct input returns error",
			input:   "not a struct",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			columns, values, err := allColumnsWithValues(tt.input)

			if tt.wantErr {
				s.Error(err)
				return
			}

			s.NoError(err)
			s.Equal(tt.wantColumns, columns)
			s.Len(values, len(tt.wantColumns))
		})
	}
}

// TestRestore verifies the transactional wipe-then-restore sequence: tables
// are cleared child-first, rows are reinserted parent-first preserving every
// field, PostgreSQL additionally resyncs each table's sequence, and any
// failure along the way is surfaced without any further statement running.
func (s *backupPeerTestSuite) TestRestore() {
	id1 := 1
	word1 := "apple"
	familiarity := "red"
	countPractise := 0
	now := time.Now().UTC()

	samplePayload := &RestorePayload{
		Words: []*models.Word{
			{Id: &id1, Word: &word1, Familiarity: &familiarity, CountPractise: &countPractise, CreatedAt: &now, UpdatedAt: &now},
		},
	}

	// deleteAllTables walks restoreOrder (words, questions, notes,
	// word_definitions, question_answer_logs, word_practice_logs)
	// in reverse, so the actual DELETE order is the mirror image of that.
	expectDeletes := func(mock sqlmock.Sqlmock) {
		mock.ExpectExec("DELETE FROM word_practice_logs").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec("DELETE FROM question_answer_logs").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec("DELETE FROM word_definitions").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec("DELETE FROM notes").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec("DELETE FROM questions").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec("DELETE FROM words").WillReturnResult(sqlmock.NewResult(0, 0))
	}

	tests := []struct {
		name      string
		dbType    string
		payload   *RestorePayload
		setupMock func(mock sqlmock.Sqlmock)
		wantErr   bool
	}{
		{
			name:    "mysql deletes child-first then inserts",
			dbType:  "mysql",
			payload: samplePayload,
			setupMock: func(mock sqlmock.Sqlmock) {
				expectDeletes(mock)
				mock.ExpectExec("INSERT INTO words").WillReturnResult(sqlmock.NewResult(1, 1))
			},
		},
		{
			name:    "postgresql resyncs every table's sequence after inserting",
			dbType:  "postgresql",
			payload: samplePayload,
			setupMock: func(mock sqlmock.Sqlmock) {
				expectDeletes(mock)
				mock.ExpectExec("INSERT INTO words").WillReturnResult(sqlmock.NewResult(1, 1))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('words'`).WillReturnResult(sqlmock.NewResult(0, 0))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('questions'`).WillReturnResult(sqlmock.NewResult(0, 0))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('notes'`).WillReturnResult(sqlmock.NewResult(0, 0))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('word_definitions'`).WillReturnResult(sqlmock.NewResult(0, 0))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('question_answer_logs'`).WillReturnResult(sqlmock.NewResult(0, 0))
				mock.ExpectExec(`SELECT setval\(pg_get_serial_sequence\('word_practice_logs'`).WillReturnResult(sqlmock.NewResult(0, 0))
			},
		},
		{
			name:    "mysql: empty payload only clears every table",
			dbType:  "mysql",
			payload: &RestorePayload{},
			setupMock: func(mock sqlmock.Sqlmock) {
				expectDeletes(mock)
			},
		},
		{
			name:    "delete failure stops before any insert",
			dbType:  "mysql",
			payload: samplePayload,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM word_practice_logs").WillReturnError(errors.New("db down"))
			},
			wantErr: true,
		},
		{
			name:    "insert failure is surfaced",
			dbType:  "mysql",
			payload: samplePayload,
			setupMock: func(mock sqlmock.Sqlmock) {
				expectDeletes(mock)
				mock.ExpectExec("INSERT INTO words").WillReturnError(errors.New("constraint violation"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			db, mock, err := sqlmock.New()
			s.Require().NoError(err)
			defer db.Close()

			mock.ExpectBegin()
			tt.setupMock(mock)

			tx, err := db.Begin()
			s.Require().NoError(err)

			bp := &BackupPeer{dbType: tt.dbType}
			restoreErr := bp.restore(tx, tt.payload)

			if tt.wantErr {
				s.Error(restoreErr)
			} else {
				s.NoError(restoreErr)
			}

			s.NoError(mock.ExpectationsWereMet())
		})
	}
}
