package peers

import (
	"database/sql"
	"fmt"
	"reflect"

	"word-flashcard/data/schema"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
)

// restoreOrder lists every table parent-first: writing rows in this order
// never violates a foreign key (word_definitions/word_practice_logs
// reference words, question_answer_logs references questions). Wiping the
// database for a restore walks this list in reverse (child-first) instead.
var restoreOrder = []string{
	schema.WORD_TABLE_NAME,
	schema.QUESTION_TABLE_NAME,
	schema.NOTE_TABLE_NAME,
	schema.WORD_DEFINITIONS_TABLE_NAME,
	schema.QUESTION_ANSWER_LOG_TABLE_NAME,
	schema.WORD_PRACTICE_LOG_TABLE_NAME,
}

// BackupPeer provides the transactional, full-database restore operation
// used by POST /api/data/import. It intentionally bypasses the normal
// Select/Insert/Update/Delete abstraction in utils/database: that layer
// always excludes id/created_at/updated_at from writes and refuses a DELETE
// with no WHERE clause, but a faithful restore needs exactly the opposite --
// every row rewritten with its original identity and history, and every
// table wiped before it's rewritten.
type BackupPeer struct {
	*BasePeer
	dbType string
}

// NewBackupPeer creates a new BackupPeer instance
func NewBackupPeer() (*BackupPeer, error) {
	base, err := NewBasePeer()
	if err != nil {
		return nil, err
	}

	config, err := database.LoadConfig()
	if err != nil {
		return nil, err
	}

	return &BackupPeer{
		BasePeer: base,
		dbType:   config.Type,
	}, nil
}

// RestoreAll replaces the entire contents of the database with payload,
// inside a single transaction: every table is emptied, then every row is
// rewritten preserving its original id/created_at/updated_at. Any failure
// rolls back the whole transaction, so a bad payload can never leave the
// database partially wiped.
func (bp *BackupPeer) RestoreAll(payload *RestorePayload) error {
	tx, err := bp.db.GetDB().Begin()
	if err != nil {
		return fmt.Errorf("failed to begin restore transaction: %w", err)
	}

	if err := bp.restore(tx, payload); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit restore transaction: %w", err)
	}

	return nil
}

// restore runs every step of the restore against an already-open
// transaction, returning the first error encountered so RestoreAll can roll
// back. Kept separate from RestoreAll purely to avoid repeating the rollback
// call at every step.
func (bp *BackupPeer) restore(tx *sql.Tx, payload *RestorePayload) error {
	if err := bp.deleteAllTables(tx); err != nil {
		return err
	}

	pf := placeholderFormat(bp.dbType)
	if err := restoreTable(tx, pf, schema.WORD_TABLE_NAME, payload.Words); err != nil {
		return err
	}
	if err := restoreTable(tx, pf, schema.QUESTION_TABLE_NAME, payload.Questions); err != nil {
		return err
	}
	if err := restoreTable(tx, pf, schema.NOTE_TABLE_NAME, payload.Notes); err != nil {
		return err
	}
	if err := restoreTable(tx, pf, schema.WORD_DEFINITIONS_TABLE_NAME, payload.WordDefinitions); err != nil {
		return err
	}
	if err := restoreTable(tx, pf, schema.QUESTION_ANSWER_LOG_TABLE_NAME, payload.QuestionAnswerLogs); err != nil {
		return err
	}
	if err := restoreTable(tx, pf, schema.WORD_PRACTICE_LOG_TABLE_NAME, payload.WordPracticeLogs); err != nil {
		return err
	}

	if bp.dbType == "postgresql" {
		if err := bp.resyncSequences(tx); err != nil {
			return err
		}
	}

	return nil
}

// deleteAllTables empties every table in restoreOrder, child tables first,
// so no foreign key constraint is ever violated. It bypasses Database.Delete
// (which refuses a query with no WHERE clause) because a full-table wipe is
// exactly what a restore needs -- there is no narrower condition to express.
func (bp *BackupPeer) deleteAllTables(tx *sql.Tx) error {
	for i := len(restoreOrder) - 1; i >= 0; i-- {
		table := restoreOrder[i]

		sqlStr, _, err := squirrel.Delete(table).ToSql()
		if err != nil {
			return fmt.Errorf("failed to build delete for table %s: %w", table, err)
		}
		if _, err := tx.Exec(sqlStr); err != nil {
			return fmt.Errorf("failed to clear table %s: %w", table, err)
		}
	}

	return nil
}

// resyncSequences advances each table's PostgreSQL SERIAL sequence past the
// highest id just restored. Unlike MySQL's AUTO_INCREMENT, explicitly
// inserting a row with a given id does not advance a SERIAL sequence, so
// without this the next auto-generated id could collide with a restored row.
func (bp *BackupPeer) resyncSequences(tx *sql.Tx) error {
	for _, table := range restoreOrder {
		query := fmt.Sprintf(
			`SELECT setval(pg_get_serial_sequence('%s', 'id'), COALESCE((SELECT MAX(id) FROM %s), 1))`,
			table, table,
		)
		if _, err := tx.Exec(query); err != nil {
			return fmt.Errorf("failed to resync sequence for table %s: %w", table, err)
		}
	}

	return nil
}

// placeholderFormat mirrors utils/database/connection.go's own choice: `?`
// placeholders for MySQL, `$1, $2, ...` for PostgreSQL.
func placeholderFormat(dbType string) squirrel.PlaceholderFormat {
	if dbType == "postgresql" {
		return squirrel.Dollar
	}
	return squirrel.Question
}

// restoreTable inserts every row into table, preserving every field
// (including id/created_at/updated_at) exactly as given.
func restoreTable[T any](tx *sql.Tx, pf squirrel.PlaceholderFormat, table string, rows []*T) error {
	for _, row := range rows {
		columns, values, err := allColumnsWithValues(row)
		if err != nil {
			return fmt.Errorf("failed to prepare row for table %s: %w", table, err)
		}
		if len(columns) == 0 {
			continue
		}

		sqlStr, args, err := squirrel.Insert(table).
			Columns(columns...).
			Values(values...).
			PlaceholderFormat(pf).
			ToSql()
		if err != nil {
			return fmt.Errorf("failed to build insert for table %s: %w", table, err)
		}

		if _, err := tx.Exec(sqlStr, args...); err != nil {
			return fmt.Errorf("failed to insert row into table %s: %w", table, err)
		}
	}

	return nil
}

// allColumnsWithValues converts a *T data/models row into its full set of
// database columns and values, in field declaration order. It mirrors
// utils/database's own struct-to-map conversion except it keeps
// id/created_at/updated_at, which restoreTable relies on to preserve a row's
// original identity and history.
//
// Every field is a pointer (*int, *string, *bool, *time.Time, ...); passing
// them straight through as query args is safe and requires no manual nil
// handling here -- database/sql's default parameter converter already
// resolves a nil pointer to SQL NULL and dereferences a non-nil one, exactly
// as it does today for the existing Insert()/structToMap() path.
func allColumnsWithValues(row interface{}) ([]string, []interface{}, error) {
	value := reflect.ValueOf(row)
	if value.Kind() == reflect.Ptr {
		if value.IsNil() {
			return nil, nil, fmt.Errorf("row must not be nil")
		}
		value = value.Elem()
	}
	if value.Kind() != reflect.Struct {
		return nil, nil, fmt.Errorf("row must be a struct or pointer to struct")
	}

	valueType := value.Type()
	columns := make([]string, 0, value.NumField())
	values := make([]interface{}, 0, value.NumField())

	for i := 0; i < value.NumField(); i++ {
		field := valueType.Field(i)
		if !field.IsExported() {
			continue
		}

		columnName := field.Tag.Get("db")
		if columnName == "" {
			columnName = field.Name
		}

		columns = append(columns, columnName)
		values = append(values, value.Field(i).Interface())
	}

	return columns, values, nil
}
