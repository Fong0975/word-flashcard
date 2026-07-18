package database

import (
	"errors"
	"testing"

	"github.com/go-sql-driver/mysql"
	"github.com/lib/pq"
)

func TestIsDuplicateEntryError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "mysql duplicate entry error",
			err:      &mysql.MySQLError{Number: mysqlDuplicateEntryErrorNumber, Message: "Duplicate entry"},
			expected: true,
		},
		{
			name:     "mysql non-duplicate error",
			err:      &mysql.MySQLError{Number: 1045, Message: "Access denied"},
			expected: false,
		},
		{
			name:     "postgres unique violation error",
			err:      &pq.Error{Code: postgresUniqueViolationErrorCode},
			expected: true,
		},
		{
			name:     "postgres non-unique-violation error",
			err:      &pq.Error{Code: "42601"},
			expected: false,
		},
		{
			name:     "generic non-driver error",
			err:      errors.New("some failure"),
			expected: false,
		},
		{
			name:     "nil error",
			err:      nil,
			expected: false,
		},
		{
			name:     "mysql duplicate entry error wrapped in DatabaseError",
			err:      NewDatabaseError("insert", &mysql.MySQLError{Number: mysqlDuplicateEntryErrorNumber, Message: "Duplicate entry"}),
			expected: true,
		},
		{
			name:     "postgres unique violation error wrapped in DatabaseError",
			err:      NewDatabaseError("insert", &pq.Error{Code: postgresUniqueViolationErrorCode}),
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsDuplicateEntryError(tt.err)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}
