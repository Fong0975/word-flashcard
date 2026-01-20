package database

import (
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"word-flashcard/utils/database/domain"
)

// createTestColumnDefinitions creates test column definitions for testing
func createTestColumnDefinitions() []domain.Column {
	return []domain.Column{
		{
			Name:          "id",
			Type:          domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
			PrimaryKey:    true,
			AutoIncrement: true,
			NotNull:       true,
		},
		{
			Name:    "name",
			Type:    domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
			NotNull: true,
		},
		{
			Name:    "email",
			Type:    domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
			Unique:  true,
		},
		{
			Name:    "created_at",
			Type:    domain.ColumnType{MySQL: "TIMESTAMP", PostgreSQL: "TIMESTAMP"},
			Default: "CURRENT_TIMESTAMP",
		},
		{
			Name:    "updated_at",
			Type:    domain.ColumnType{MySQL: "TIMESTAMP", PostgreSQL: "TIMESTAMP"},
			Default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
		},
	}
}

// createTestTableDefinitionForCreator creates a complete table definition for testing
func createTestTableDefinitionForCreator() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name:    "test_table",
		Columns: createTestColumnDefinitions(),
		Indexes: []domain.Index{
			{
				Name:    "idx_name",
				Columns: []string{"name"},
				Unique:  false,
			},
			{
				Name:    "idx_email_unique",
				Columns: []string{"email"},
				Unique:  true,
			},
		},
	}
}

// Test CREATE TABLE SQL generation for different databases
func TestGetCreateSQL(t *testing.T) {
	testTable := createTestTableDefinitionForCreator()

	// Test MySQL CREATE SQL
	mysqlSQL := GetCreateSQL(testTable, "mysql", "wfc_")

	expectedSubstrings := []string{
		"CREATE TABLE IF NOT EXISTS wfc_test_table",
		"id INT AUTO_INCREMENT NOT NULL PRIMARY KEY",
		"name VARCHAR(255) NOT NULL",
		"email VARCHAR(255) UNIQUE",
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
	}

	for _, expected := range expectedSubstrings {
		if !strings.Contains(mysqlSQL, expected) {
			t.Errorf("MySQL SQL missing expected substring: %s\nActual SQL: %s", expected, mysqlSQL)
		}
	}

	// Test PostgreSQL CREATE SQL
	postgresSQL := GetCreateSQL(testTable, "postgresql", "wfc_")

	expectedPostgresSubstrings := []string{
		"CREATE TABLE IF NOT EXISTS wfc_test_table",
		"id SERIAL NOT NULL PRIMARY KEY",
		"name VARCHAR(255) NOT NULL",
		"email VARCHAR(255) UNIQUE",
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", // PostgreSQL doesn't support ON UPDATE
	}

	for _, expected := range expectedPostgresSubstrings {
		if !strings.Contains(postgresSQL, expected) {
			t.Errorf("PostgreSQL SQL missing expected substring: %s\nActual SQL: %s", expected, postgresSQL)
		}
	}

	// PostgreSQL should not contain ON UPDATE
	if strings.Contains(postgresSQL, "ON UPDATE") {
		t.Error("PostgreSQL SQL should not contain 'ON UPDATE' clause")
	}
}

// Test buildColumnSQL for different column configurations
func TestBuildColumnSQL(t *testing.T) {
	tests := []struct {
		name     string
		column   domain.Column
		dbType   string
		expected []string // substrings that should be present
	}{
		{
			name: "MySQL auto increment primary key",
			column: domain.Column{
				Name:          "id",
				Type:          domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
				PrimaryKey:    true,
				AutoIncrement: true,
				NotNull:       true,
			},
			dbType:   "mysql",
			expected: []string{"id", "INT", "AUTO_INCREMENT", "NOT NULL", "PRIMARY KEY"},
		},
		{
			name: "PostgreSQL auto increment primary key",
			column: domain.Column{
				Name:          "id",
				Type:          domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
				PrimaryKey:    true,
				AutoIncrement: true,
				NotNull:       true,
			},
			dbType:   "postgresql",
			expected: []string{"id", "SERIAL", "NOT NULL", "PRIMARY KEY"},
		},
		{
			name: "Required text field",
			column: domain.Column{
				Name:    "name",
				Type:    domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
				NotNull: true,
			},
			dbType:   "mysql",
			expected: []string{"name", "VARCHAR(255)", "NOT NULL"},
		},
		{
			name: "Unique field",
			column: domain.Column{
				Name:   "email",
				Type:   domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
				Unique: true,
			},
			dbType:   "mysql",
			expected: []string{"email", "VARCHAR(255)", "UNIQUE"},
		},
		{
			name: "Field with default value",
			column: domain.Column{
				Name:    "status",
				Type:    domain.ColumnType{MySQL: "VARCHAR(50)", PostgreSQL: "VARCHAR(50)"},
				Default: "'active'",
			},
			dbType:   "mysql",
			expected: []string{"status", "VARCHAR(50)", "DEFAULT", "'active'"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := buildColumnSQL(tt.column, tt.dbType)

			for _, expected := range tt.expected {
				if !strings.Contains(result, expected) {
					t.Errorf("Expected substring '%s' not found in result: %s", expected, result)
				}
			}
		})
	}
}

// Test retrieving primary key columns from a list of columns
func TestGetPrimaryKeyColumns(t *testing.T) {
	columns := []domain.Column{
		{Name: "id", PrimaryKey: true},
		{Name: "name", PrimaryKey: false},
		{Name: "tenant_id", PrimaryKey: true},
		{Name: "email", PrimaryKey: false},
	}

	pkColumns := getPrimaryKeyColumns(columns)

	if len(pkColumns) != 2 {
		t.Errorf("Expected 2 primary key columns, got %d", len(pkColumns))
	}

	expectedPKs := []string{"id", "tenant_id"}
	for _, expected := range expectedPKs {
		found := false
		for _, pk := range pkColumns {
			if pk == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected primary key column '%s' not found in result", expected)
		}
	}
}

// Test index SQL generation for different databases
func TestGetIndexSQL(t *testing.T) {
	testTable := createTestTableDefinitionForCreator()

	// Test MySQL index SQL
	mysqlIndexes := GetIndexSQL(testTable, "mysql", "wfc_")

	if len(mysqlIndexes) != 2 {
		t.Errorf("Expected 2 index SQL statements, got %d", len(mysqlIndexes))
	}

	// Check for regular index
	regularIndexFound := false
	uniqueIndexFound := false

	for _, indexSQL := range mysqlIndexes {
		if strings.Contains(indexSQL, "idx_test_table_idx_name") && strings.Contains(indexSQL, "CREATE INDEX") && !strings.Contains(indexSQL, "UNIQUE") {
			regularIndexFound = true
		}
		if strings.Contains(indexSQL, "idx_test_table_idx_email_unique") && strings.Contains(indexSQL, "CREATE UNIQUE INDEX") {
			uniqueIndexFound = true
		}
	}

	if !regularIndexFound {
		t.Error("Regular index SQL not found")
	}
	if !uniqueIndexFound {
		t.Error("Unique index SQL not found")
	}

	// Test PostgreSQL index SQL (should be same as MySQL for basic indexes)
	postgresIndexes := GetIndexSQL(testTable, "postgresql", "wfc_")
	if len(postgresIndexes) != 2 {
		t.Errorf("Expected 2 PostgreSQL index SQL statements, got %d", len(postgresIndexes))
	}
}

// Test create database tables
func TestCreateDatabaseTables(t *testing.T) {
	// Setup clean registry and register test table
	setupCleanRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	// Mock expectations for CREATE TABLE
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS wfc_test_table").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock expectations for CREATE INDEX (2 indexes)
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test
	err := CreateDatabaseTables(db, "mysql", "wfc_")
	if err != nil {
		t.Errorf("CreateDatabaseTables() failed: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test error handling during table creation
func TestCreateDatabaseTablesWithFailure(t *testing.T) {
	// Setup clean registry and register test table
	setupCleanRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	// Mock CREATE TABLE to fail
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS wfc_test_table").
		WillReturnError(sqlmock.ErrCancelled)

	// Execute test
	err := CreateDatabaseTables(db, "mysql", "wfc_")
	if err == nil {
		t.Error("Expected CreateDatabaseTables() to fail, but it succeeded")
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test error handling during index creation
func TestCreateDatabaseTablesIndexFailure(t *testing.T) {
	// Setup clean registry and register test table
	setupCleanRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	// Mock CREATE TABLE to succeed
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS wfc_test_table").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock first index to fail (should not stop execution)
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnError(sqlmock.ErrCancelled)

	// Mock second index to succeed
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test - should succeed even if index creation fails
	err := CreateDatabaseTables(db, "mysql", "wfc_")
	if err != nil {
		t.Errorf("CreateDatabaseTables() should not fail on index errors, but got: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}