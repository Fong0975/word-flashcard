package database

import (
	"errors"
	"strings"
	"testing"

	"word-flashcard/utils/database/domain"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/suite"
)

// tableCreatorTestSuite testing suite components
type tableCreatorTestSuite struct {
	suite.Suite
	t *testing.T
}

// TestTableCreatorSuite runs the test suite
func TestTableCreatorSuite(t *testing.T) {
	suite.Run(t, new(tableCreatorTestSuite))
}

// SetupTest for the test suite
func (s *tableCreatorTestSuite) SetupTest() {
	s.t = s.T()
}

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
			Name:    "category_id",
			Type:    domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
			NotNull: true,
			Index:   true,
			ForeignKey: &domain.ForeignKey{
				Table:  "categories",
				Column: "id",
			},
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
func (suite *tableCreatorTestSuite) TestGetCreateSQL() {
	testTable := createTestTableDefinitionForCreator()

	// Test MySQL CREATE SQL
	mysqlSQL := GetCreateSQL(testTable, "mysql")

	expectedSubstrings := []string{
		"CREATE TABLE IF NOT EXISTS test_table",
		"id INT AUTO_INCREMENT NOT NULL PRIMARY KEY",
		"name VARCHAR(255) NOT NULL",
		"email VARCHAR(255) UNIQUE",
		"category_id INT NOT NULL",
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
		"FOREIGN KEY (category_id) REFERENCES categories(id)",
	}

	for _, expected := range expectedSubstrings {
		if !strings.Contains(mysqlSQL, expected) {
			suite.t.Errorf("MySQL SQL missing expected substring: %s\nActual SQL: %s", expected, mysqlSQL)
		}
	}

	// Test PostgreSQL CREATE SQL
	postgresSQL := GetCreateSQL(testTable, "postgresql")

	expectedPostgresSubstrings := []string{
		"CREATE TABLE IF NOT EXISTS test_table",
		"id SERIAL NOT NULL PRIMARY KEY",
		"name VARCHAR(255) NOT NULL",
		"email VARCHAR(255) UNIQUE",
		"category_id INTEGER NOT NULL",
		"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", // PostgreSQL doesn't support ON UPDATE
		"FOREIGN KEY (category_id) REFERENCES categories(id)",
	}

	for _, expected := range expectedPostgresSubstrings {
		if !strings.Contains(postgresSQL, expected) {
			suite.t.Errorf("PostgreSQL SQL missing expected substring: %s\nActual SQL: %s", expected, postgresSQL)
		}
	}

	// PostgreSQL should not contain ON UPDATE
	if strings.Contains(postgresSQL, "ON UPDATE") {
		suite.t.Error("PostgreSQL SQL should not contain 'ON UPDATE' clause")
	}
}

// Test buildColumnSQL for different column configurations
func (suite *tableCreatorTestSuite) TestBuildColumnSQL() {
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
		suite.t.Run(tt.name, func(t *testing.T) {
			result := buildColumnSQL(tt.column, tt.dbType)

			for _, expected := range tt.expected {
				if !strings.Contains(result, expected) {
					suite.t.Errorf("Expected substring '%s' not found in result: %s", expected, result)
				}
			}
		})
	}
}

// Test retrieving primary key columns from a list of columns
func (suite *tableCreatorTestSuite) TestGetPrimaryKeyColumns() {
	columns := []domain.Column{
		{Name: "id", PrimaryKey: true},
		{Name: "name", PrimaryKey: false},
		{Name: "tenant_id", PrimaryKey: true},
		{Name: "email", PrimaryKey: false},
	}

	pkColumns := getPrimaryKeyColumns(columns)

	if len(pkColumns) != 2 {
		suite.t.Errorf("Expected 2 primary key columns, got %d", len(pkColumns))
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
			suite.t.Errorf("Expected primary key column '%s' not found in result", expected)
		}
	}
}

// Test index SQL generation for different databases
func (suite *tableCreatorTestSuite) TestGetIndexSQL() {
	testTable := createTestTableDefinitionForCreator()

	// Test MySQL index SQL
	mysqlIndexes := GetIndexSQL(testTable, "mysql")

	if len(mysqlIndexes) != 3 {
		suite.t.Errorf("Expected 3 index SQL statements, got %d", len(mysqlIndexes))
	}

	// Check for regular index, unique index, and category_id index
	regularIndexFound := false
	uniqueIndexFound := false
	categoryIndexFound := false

	for _, indexSQL := range mysqlIndexes {
		if strings.Contains(indexSQL, "idx_test_table_idx_name") && strings.Contains(indexSQL, "CREATE INDEX") && !strings.Contains(indexSQL, "UNIQUE") {
			regularIndexFound = true
		}
		if strings.Contains(indexSQL, "idx_test_table_idx_email_unique") && strings.Contains(indexSQL, "CREATE UNIQUE INDEX") {
			uniqueIndexFound = true
		}
		if strings.Contains(indexSQL, "idx_test_table_category_id") && strings.Contains(indexSQL, "CREATE INDEX") && !strings.Contains(indexSQL, "UNIQUE") {
			categoryIndexFound = true
		}
	}

	if !regularIndexFound {
		suite.t.Error("Regular index SQL not found")
	}
	if !uniqueIndexFound {
		suite.t.Error("Unique index SQL not found")
	}
	if !categoryIndexFound {
		suite.t.Error("Category ID index SQL not found")
	}

	// Test PostgreSQL index SQL (should be same as MySQL for basic indexes)
	postgresIndexes := GetIndexSQL(testTable, "postgresql")
	if len(postgresIndexes) != 3 {
		suite.t.Errorf("Expected 3 PostgreSQL index SQL statements, got %d", len(postgresIndexes))
	}
}

// Test column-level Unique attribute creates unique indexes
func (suite *tableCreatorTestSuite) TestGetIndexSQL_ColumnLevelUniqueIndex() {
	testTable := &domain.TableDefinition{
		Name: "test_unique_columns",
		Columns: []domain.Column{
			{
				Name:       "id",
				Type:       domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
				PrimaryKey: true,
			},
			{
				Name:   "username",
				Type:   domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
				Unique: true, // Should create unique index
			},
			{
				Name:  "category_id",
				Type:  domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
				Index: true, // Should create regular index
			},
			{
				Name: "description",
				Type: domain.ColumnType{MySQL: "TEXT", PostgreSQL: "TEXT"},
				// No index attributes
			},
		},
		Indexes: []domain.Index{}, // No explicit indexes
	}

	indexes := GetIndexSQL(testTable, "mysql")

	// Should create 2 indexes: unique for username and regular for category_id
	if len(indexes) != 2 {
		suite.t.Errorf("Expected 2 index SQL statements, got %d", len(indexes))
	}

	usernameUniqueIndexFound := false
	categoryIndexFound := false

	for _, indexSQL := range indexes {
		if strings.Contains(indexSQL, "idx_test_unique_columns_username_unique") && strings.Contains(indexSQL, "CREATE UNIQUE INDEX") {
			usernameUniqueIndexFound = true
		}
		if strings.Contains(indexSQL, "idx_test_unique_columns_category_id") && strings.Contains(indexSQL, "CREATE INDEX") && !strings.Contains(indexSQL, "UNIQUE") {
			categoryIndexFound = true
		}
	}

	if !usernameUniqueIndexFound {
		suite.t.Error("Unique index SQL for 'username' column not found")
	}
	if !categoryIndexFound {
		suite.t.Error("Regular index SQL for 'category_id' column not found")
	}
}

// Test create database tables
func (suite *tableCreatorTestSuite) TestCreateDatabaseTables() {
	// Setup clean registry and register test table
	ClearRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(suite.t, "mysql")
	defer cleanup()

	// Mock table existence check (table doesn't exist)
	mock.ExpectExec("SELECT 1 FROM test_table WHERE 1=0").
		WillReturnError(errors.New("Table 'testdb.test_table' doesn't exist"))

	// Mock expectations for CREATE TABLE
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS test_table").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock expectations for CREATE INDEX (2 indexes)
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test
	err := CreateDatabaseTables(db, "mysql")
	if err != nil {
		suite.t.Errorf("CreateDatabaseTables() failed: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		suite.t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test error handling during table creation
func (suite *tableCreatorTestSuite) TestCreateDatabaseTablesWithFailure() {
	// Setup clean registry and register test table
	ClearRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(suite.t, "mysql")
	defer cleanup()

	// Mock table existence check (table doesn't exist)
	mock.ExpectExec("SELECT 1 FROM test_table WHERE 1=0").
		WillReturnError(errors.New("Table 'testdb.test_table' doesn't exist"))

	// Mock CREATE TABLE to fail
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS test_table").
		WillReturnError(sqlmock.ErrCancelled)

	// Execute test
	err := CreateDatabaseTables(db, "mysql")
	if err == nil {
		suite.t.Error("Expected CreateDatabaseTables() to fail, but it succeeded")
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		suite.t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test error handling during index creation
func (suite *tableCreatorTestSuite) TestCreateDatabaseTablesIndexFailure() {
	// Setup clean registry and register test table
	ClearRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(suite.t, "mysql")
	defer cleanup()

	// Mock table existence check (table doesn't exist)
	mock.ExpectExec("SELECT 1 FROM test_table WHERE 1=0").
		WillReturnError(errors.New("Table 'testdb.test_table' doesn't exist"))

	// Mock CREATE TABLE to succeed
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS test_table").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock first index to fail (should not stop execution)
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnError(sqlmock.ErrCancelled)

	// Mock second index to succeed
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test - should succeed even if index creation fails
	err := CreateDatabaseTables(db, "mysql")
	if err != nil {
		suite.t.Errorf("CreateDatabaseTables() should not fail on index errors, but got: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		suite.t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test tableExists function for database table existence
func (suite *tableCreatorTestSuite) TestTableExistsInDatabase() {
	tests := []struct {
		name          string
		dbType        string
		tableName     string
		execError     error
		expectedExists bool
		expectError   bool
	}{
		{
			name:          "Table exists - MySQL",
			dbType:        "mysql",
			tableName:     "users",
			execError:     nil,
			expectedExists: true,
			expectError:   false,
		},
		{
			name:          "Table does not exist - MySQL",
			dbType:        "mysql",
			tableName:     "nonexistent_table",
			execError:     errors.New("Table 'testdb.nonexistent_table' doesn't exist"),
			expectedExists: false,
			expectError:   false, // Should be handled as table doesn't exist, not an error
		},
		{
			name:          "Table exists - PostgreSQL",
			dbType:        "postgresql",
			tableName:     "users",
			execError:     nil,
			expectedExists: true,
			expectError:   false,
		},
		{
			name:          "Table does not exist - PostgreSQL",
			dbType:        "postgresql",
			tableName:     "missing_table",
			execError:     errors.New("relation \"missing_table\" does not exist"),
			expectedExists: false,
			expectError:   false,
		},
		{
			name:          "Database connection error",
			dbType:        "mysql",
			tableName:     "any_table",
			execError:     errors.New("connection lost to database server"),
			expectedExists: false,
			expectError:   true, // This should be treated as a real error
		},
	}

	for _, tt := range tests {
		suite.t.Run(tt.name, func(t *testing.T) {
			db, mock, cleanup := createMockDatabase(t, tt.dbType)
			defer cleanup()

			expectedQuery := "SELECT 1 FROM " + tt.tableName + " WHERE 1=0"
			if tt.execError != nil {
				mock.ExpectExec(expectedQuery).WillReturnError(tt.execError)
			} else {
				mock.ExpectExec(expectedQuery).WillReturnResult(sqlmock.NewResult(0, 0))
			}

			exists, err := tableExists(db, tt.tableName, tt.dbType)

			if tt.expectError && err == nil {
				suite.t.Error("Expected error but got nil")
				return
			}

			if !tt.expectError && err != nil {
				suite.t.Errorf("Unexpected error: %v", err)
				return
			}

			if !tt.expectError && exists != tt.expectedExists {
				suite.t.Errorf("Expected exists=%v, got %v", tt.expectedExists, exists)
			}

			// Verify all expectations were met
			if err := mock.ExpectationsWereMet(); err != nil {
				suite.t.Errorf("Unfulfilled expectations: %v", err)
			}
		})
	}
}

// Test CreateDatabaseTables skips existing tables
func (suite *tableCreatorTestSuite) TestCreateDatabaseTablesSkipsExistingTables() {
	// Setup clean registry and register test table
	ClearRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(suite.t, "mysql")
	defer cleanup()

	// Mock table existence check (table exists)
	mock.ExpectExec("SELECT 1 FROM test_table WHERE 1=0").
		WillReturnResult(sqlmock.NewResult(0, 0)) // No error means table exists

	// Mock expectations for CREATE INDEX (should still create indexes even if table exists)
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test
	err := CreateDatabaseTables(db, "mysql")
	if err != nil {
		suite.t.Errorf("CreateDatabaseTables() failed: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		suite.t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test CreateDatabaseTables creates non-existing tables
func (suite *tableCreatorTestSuite) TestCreateDatabaseTablesCreatesNonExistingTable() {
	// Setup clean registry and register test table
	ClearRegistry()
	testTable := createTestTableDefinitionForCreator()
	RegisterTable(testTable)

	db, mock, cleanup := createMockDatabase(suite.t, "mysql")
	defer cleanup()

	// Mock table existence check (table doesn't exist)
	mock.ExpectExec("SELECT 1 FROM test_table WHERE 1=0").
		WillReturnError(errors.New("Table 'testdb.test_table' doesn't exist"))

	// Mock expectations for CREATE TABLE
	mock.ExpectExec("CREATE TABLE IF NOT EXISTS test_table").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock expectations for CREATE INDEX
	mock.ExpectExec("CREATE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("CREATE UNIQUE INDEX IF NOT EXISTS").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Execute test
	err := CreateDatabaseTables(db, "mysql")
	if err != nil {
		suite.t.Errorf("CreateDatabaseTables() failed: %v", err)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		suite.t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test getForeignKeyConstraints function
func (suite *tableCreatorTestSuite) TestGetForeignKeyConstraints() {
	tests := []struct {
		name             string
		columns          []domain.Column
		expectedCount    int
		expectedContains []string
	}{
		{
			name: "No foreign keys",
			columns: []domain.Column{
				{
					Name:       "id",
					Type:       domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					PrimaryKey: true,
				},
				{
					Name: "name",
					Type: domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
				},
			},
			expectedCount:    0,
			expectedContains: []string{},
		},
		{
			name: "Single foreign key",
			columns: []domain.Column{
				{
					Name:       "id",
					Type:       domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					PrimaryKey: true,
				},
				{
					Name: "user_id",
					Type: domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					ForeignKey: &domain.ForeignKey{
						Table:  "users",
						Column: "id",
					},
				},
			},
			expectedCount: 1,
			expectedContains: []string{
				"FOREIGN KEY (user_id) REFERENCES users(id)",
			},
		},
		{
			name: "Multiple foreign keys",
			columns: []domain.Column{
				{
					Name:       "id",
					Type:       domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					PrimaryKey: true,
				},
				{
					Name: "user_id",
					Type: domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					ForeignKey: &domain.ForeignKey{
						Table:  "users",
						Column: "id",
					},
				},
				{
					Name: "category_id",
					Type: domain.ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"},
					ForeignKey: &domain.ForeignKey{
						Table:  "categories",
						Column: "id",
					},
				},
			},
			expectedCount: 2,
			expectedContains: []string{
				"FOREIGN KEY (user_id) REFERENCES users(id)",
				"FOREIGN KEY (category_id) REFERENCES categories(id)",
			},
		},
	}

	for _, tt := range tests {
		suite.t.Run(tt.name, func(t *testing.T) {
			constraints := getForeignKeyConstraints(tt.columns)

			if len(constraints) != tt.expectedCount {
				suite.t.Errorf("Expected %d foreign key constraints, got %d", tt.expectedCount, len(constraints))
			}

			for _, expectedConstraint := range tt.expectedContains {
				found := false
				for _, constraint := range constraints {
					if constraint == expectedConstraint {
						found = true
						break
					}
				}
				if !found {
					suite.t.Errorf("Expected constraint '%s' not found in result: %v", expectedConstraint, constraints)
				}
			}
		})
	}
}