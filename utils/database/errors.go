package database

import (
	"errors"

	"github.com/go-sql-driver/mysql"
	"github.com/lib/pq"
)

// mysqlDuplicateEntryErrorNumber is MySQL's ER_DUP_ENTRY error code, returned
// when an INSERT/UPDATE violates a UNIQUE constraint.
const mysqlDuplicateEntryErrorNumber = 1062

// postgresUniqueViolationErrorCode is PostgreSQL's unique_violation SQLSTATE code.
const postgresUniqueViolationErrorCode = "23505"

// IsDuplicateEntryError reports whether err (or any error it wraps, e.g. a
// DatabaseError) represents a UNIQUE constraint violation, regardless of
// whether the underlying driver is MySQL or PostgreSQL. Callers use this to
// distinguish "the value the client submitted already exists" (safe to tell
// the client) from a genuine internal database failure.
func IsDuplicateEntryError(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr.Number == mysqlDuplicateEntryErrorNumber
	}

	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return string(pqErr.Code) == postgresUniqueViolationErrorCode
	}

	return false
}
