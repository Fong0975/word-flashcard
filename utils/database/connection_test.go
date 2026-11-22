package database

import (
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/suite"
)

// connectionTestSuite testing suite components
type connectionTestSuite struct {
	suite.Suite
	t *testing.T
}

// TestConnectionSuite runs the test suite
func TestConnectionSuite(t *testing.T) {
	suite.Run(t, new(connectionTestSuite))
}

// SetupTest for the test suite
func (s *connectionTestSuite) SetupTest() {
	s.t = s.T()
}

// createTestConfig creates a default test configuration
func createTestConfig() *DBConfig {
	return &DBConfig{
		Host:         "localhost",
		Port:         3306,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}
}

// createMockDatabase creates a UniversalDatabase with mock SQL connection
func createMockDatabase(t *testing.T) (*UniversalDatabase, sqlmock.Sqlmock, func()) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}

	db := NewUniversalDatabase(createTestConfig())
	db.db = mockDB

	cleanup := func() {
		mockDB.Close()
	}

	return db, mock, cleanup
}

// ========== Connection Management Tests ==========

// TestConnect tests successful database connection and disconnection
func (s *connectionTestSuite) TestConnect() {
	db, mock, _ := createMockDatabase(s.t)

	// Test that database connection is established
	s.NotNil(db.db, "Database connection should be established")

	// Mock expects close for the Close() method test
	mock.ExpectClose()

	// Test Close method
	err := db.Close()
	s.NoError(err, "Close should succeed")
	s.Nil(db.db, "Database connection should be nil after close")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// ========== CRUD Operations Tests ==========

// Test struct for Select operations
type testUser struct {
	Id   int    `db:"id"`
	Name string `db:"name"`
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}

// ========== Select Tests ==========

// TestSelect tests selecting records from database
func (s *connectionTestSuite) TestSelect() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects a SELECT query
	rows := sqlmock.NewRows([]string{"id", "name"}).
		AddRow(1, "Test User 1").
		AddRow(2, "Test User 2")

	mock.ExpectQuery("SELECT \\* FROM users ORDER BY name").
		WillReturnRows(rows)

	// Prepare test parameters
	orderBy := []*string{stringPtr("name")}
	var results []testUser

	// Test Select method
	err := db.Select("users", nil, nil, orderBy, nil, nil, &results)

	s.NoError(err, "Select should succeed")
	s.Len(results, 2, "Should return 2 users")
	s.Equal(1, results[0].Id)
	s.Equal("Test User 1", results[0].Name)
	s.Equal(2, results[1].Id)
	s.Equal("Test User 2", results[1].Name)

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestSelectWithLimit tests selecting records with LIMIT clause
func (s *connectionTestSuite) TestSelectWithLimit() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects a SELECT query with LIMIT
	rows := sqlmock.NewRows([]string{"id", "name"}).
		AddRow(1, "Test User 1").
		AddRow(2, "Test User 2")

	mock.ExpectQuery("SELECT \\* FROM users ORDER BY name LIMIT 2").
		WillReturnRows(rows)

	// Prepare test parameters
	orderBy := []*string{stringPtr("name")}
	limit := uint64(2)
	var results []testUser

	// Test Select method with limit
	err := db.Select("users", nil, nil, orderBy, &limit, nil, &results)

	s.NoError(err, "Select with limit should succeed")
	s.Len(results, 2, "Should return 2 users")
	s.Equal(1, results[0].Id)
	s.Equal("Test User 1", results[0].Name)
	s.Equal(2, results[1].Id)
	s.Equal("Test User 2", results[1].Name)

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestSelectWithOffset tests selecting records with OFFSET clause
func (s *connectionTestSuite) TestSelectWithOffset() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects a SELECT query with OFFSET
	rows := sqlmock.NewRows([]string{"id", "name"}).
		AddRow(3, "Test User 3").
		AddRow(4, "Test User 4")

	mock.ExpectQuery("SELECT \\* FROM users ORDER BY name OFFSET 2").
		WillReturnRows(rows)

	// Prepare test parameters
	orderBy := []*string{stringPtr("name")}
	offset := uint64(2)
	var results []testUser

	// Test Select method with offset
	err := db.Select("users", nil, nil, orderBy, nil, &offset, &results)

	s.NoError(err, "Select with offset should succeed")
	s.Len(results, 2, "Should return 2 users")
	s.Equal(3, results[0].Id)
	s.Equal("Test User 3", results[0].Name)
	s.Equal(4, results[1].Id)
	s.Equal("Test User 4", results[1].Name)

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestSelectWithLimitAndOffset tests selecting records with both LIMIT and OFFSET clauses
func (s *connectionTestSuite) TestSelectWithLimitAndOffset() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects a SELECT query with LIMIT and OFFSET
	rows := sqlmock.NewRows([]string{"id", "name"}).
		AddRow(3, "Test User 3").
		AddRow(4, "Test User 4")

	mock.ExpectQuery("SELECT \\* FROM users ORDER BY name LIMIT 2 OFFSET 2").
		WillReturnRows(rows)

	// Prepare test parameters
	orderBy := []*string{stringPtr("name")}
	limit := uint64(2)
	offset := uint64(2)
	var results []testUser

	// Test Select method with both limit and offset
	err := db.Select("users", nil, nil, orderBy, &limit, &offset, &results)

	s.NoError(err, "Select with limit and offset should succeed")
	s.Len(results, 2, "Should return 2 users")
	s.Equal(3, results[0].Id)
	s.Equal("Test User 3", results[0].Name)
	s.Equal(4, results[1].Id)
	s.Equal("Test User 4", results[1].Name)

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestSelectWithTermsTranslation tests that terms in orderBy are correctly translated to MySQL syntax
func (s *connectionTestSuite) TestSelectWithTermsTranslation() {
	orderBy := []*string{stringPtr(TERM_MAPPING_FUNC_RANDOM)}
	var results []testUser

	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects SELECT query with RAND()
	rows := sqlmock.NewRows([]string{"id", "name"}).
		AddRow(1, "Test User 1").
		AddRow(2, "Test User 2")

	mock.ExpectQuery("SELECT \\* FROM users ORDER BY RAND\\(\\)").
		WillReturnRows(rows)

	err := db.Select("users", nil, nil, orderBy, nil, nil, &results)

	s.NoError(err, "Select with terms translation should succeed")
	s.Len(results, 2, "Should return 2 users")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// ========== Insert Tests ==========

// TestInsert tests inserting records into database
func (s *connectionTestSuite) TestInsert() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Test data to insert
	testData := testUser{
		Name: "New User",
	}

	// Mock expects an INSERT query
	// Note: columns are now sorted alphabetically: created_at, name, updated_at
	mock.ExpectExec("INSERT INTO users").
		WithArgs(sqlmock.AnyArg(), "New User", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock expects a SELECT query to get the inserted ID
	rows := sqlmock.NewRows([]string{"id"}).AddRow(1)
	mock.ExpectQuery("SELECT id FROM users").
		WithArgs(sqlmock.AnyArg(), "New User", sqlmock.AnyArg()).
		WillReturnRows(rows)

	// Test Insert method
	insertedID, err := db.Insert("users", testData)

	s.NoError(err, "Insert should succeed")
	s.Equal(int64(1), insertedID, "Should return inserted ID")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// ========== Update Tests ==========

// TestUpdate tests updating records in database
func (s *connectionTestSuite) TestUpdate() {
	updateData := testUser{Name: "Updated User"}
	whereCondition := squirrel.Eq{"id": 1}

	tests := []struct {
		name          string
		disconnected  bool
		where         squirrel.Sqlizer
		setupMock     func(mock sqlmock.Sqlmock)
		expectedRows  int64
		errorContains string
	}{
		{
			name:  "success",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				// Note: The Update method automatically adds updated_at field
				mock.ExpectExec("UPDATE users SET").
					WillReturnResult(sqlmock.NewResult(0, 1))
			},
			expectedRows: 1,
		},
		{
			name:          "database not connected",
			disconnected:  true,
			where:         whereCondition,
			errorContains: "not connected",
		},
		{
			name:          "nil where clause is rejected",
			where:         nil,
			errorContains: "requires a WHERE clause",
		},
		{
			name:  "exec fails",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE users SET").
					WillReturnError(errors.New("exec failed"))
			},
			errorContains: "exec failed",
		},
		{
			name:  "rows affected lookup fails",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE users SET").
					WillReturnResult(sqlmock.NewErrorResult(errors.New("rows affected failed")))
			},
			errorContains: "rows affected failed",
		},
		{
			name:  "zero rows affected",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE users SET").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			errorContains: "no rows were affected",
		},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			db, mock, cleanup := createMockDatabase(s.t)
			defer cleanup()

			if tt.disconnected {
				db.db = nil
			}
			if tt.setupMock != nil {
				tt.setupMock(mock)
			}

			rowsAffected, err := db.Update("users", updateData, tt.where)

			if tt.errorContains != "" {
				s.Error(err)
				s.Contains(err.Error(), tt.errorContains)
			} else {
				s.NoError(err)
				s.Equal(tt.expectedRows, rowsAffected)
			}

			if !tt.disconnected {
				s.NoError(mock.ExpectationsWereMet())
			}
		})
	}
}

// ========== Delete Tests ==========

// TestDelete tests deleting records from database
func (s *connectionTestSuite) TestDelete() {
	whereCondition := squirrel.Eq{"id": 1}

	tests := []struct {
		name          string
		disconnected  bool
		where         squirrel.Sqlizer
		setupMock     func(mock sqlmock.Sqlmock)
		expectedRows  int64
		errorContains string
	}{
		{
			name:  "success",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM users").
					WillReturnResult(sqlmock.NewResult(0, 1))
			},
			expectedRows: 1,
		},
		{
			name:          "database not connected",
			disconnected:  true,
			where:         whereCondition,
			errorContains: "not connected",
		},
		{
			name:          "nil where clause is rejected",
			where:         nil,
			errorContains: "requires a WHERE clause",
		},
		{
			name:  "exec fails",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM users").
					WillReturnError(errors.New("exec failed"))
			},
			errorContains: "exec failed",
		},
		{
			name:  "rows affected lookup fails",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM users").
					WillReturnResult(sqlmock.NewErrorResult(errors.New("rows affected failed")))
			},
			errorContains: "rows affected failed",
		},
		{
			name:  "zero rows affected",
			where: whereCondition,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM users").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			errorContains: "no rows were affected",
		},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			db, mock, cleanup := createMockDatabase(s.t)
			defer cleanup()

			if tt.disconnected {
				db.db = nil
			}
			if tt.setupMock != nil {
				tt.setupMock(mock)
			}

			rowsAffected, err := db.Delete("users", tt.where)

			if tt.errorContains != "" {
				s.Error(err)
				s.Contains(err.Error(), tt.errorContains)
			} else {
				s.NoError(err)
				s.Equal(tt.expectedRows, rowsAffected)
			}

			if !tt.disconnected {
				s.NoError(mock.ExpectationsWereMet())
			}
		})
	}
}

// ========== Count Tests ==========

// TestCount tests counting records with WHERE condition
func (s *connectionTestSuite) TestCount() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Create where condition
	whereCondition := squirrel.Eq{"name": "Test User"}

	// Mock expects a COUNT query with WHERE clause
	rows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(2)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM users WHERE name = \\?").
		WithArgs("Test User").
		WillReturnRows(rows)

	// Test Count method
	count, err := db.Count("users", whereCondition)

	s.NoError(err, "Count should succeed")
	s.Equal(int64(2), count, "Should return count of 2")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// ========== Low-level Operations Tests ==========

// TestExec tests executing raw SQL queries
func (s *connectionTestSuite) TestExec() {
	db, mock, cleanup := createMockDatabase(s.t)
	defer cleanup()

	// Mock expects an SQL execution
	mock.ExpectExec("CREATE TABLE test_table").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Test Exec method
	result, err := db.Exec("CREATE TABLE test_table")

	s.NoError(err, "Exec should succeed")
	s.NotNil(result, "Result should not be nil")

	// Verify the result
	rowsAffected, err := result.RowsAffected()
	s.NoError(err)
	s.Equal(int64(1), rowsAffected, "Expected 1 row affected")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestQuery tests executing raw SQL queries that return rows
func (s *connectionTestSuite) TestQuery() {
	// Test successful query returning rows with expected columns
	{
		db, mock, cleanup := createMockDatabase(s.t)
		defer cleanup()

		rows := sqlmock.NewRows([]string{"id", "name"}).
			AddRow(1, "Test User")

		mock.ExpectQuery("SELECT \\* FROM users WHERE 1=0").
			WillReturnRows(rows)

		result, err := db.Query("SELECT * FROM users WHERE 1=0")

		s.NoError(err, "Query should succeed")
		s.NotNil(result, "Rows should not be nil")

		cols, err := result.Columns()
		s.NoError(err)
		s.Equal([]string{"id", "name"}, cols, "Should return expected column names")

		result.Close()

		s.NoError(mock.ExpectationsWereMet())
	}

	// Test query failure propagates error
	{
		db, mock, cleanup := createMockDatabase(s.t)
		defer cleanup()

		mock.ExpectQuery("SELECT \\* FROM missing_table WHERE 1=0").
			WillReturnError(sqlmock.ErrCancelled)

		result, err := db.Query("SELECT * FROM missing_table WHERE 1=0")

		s.Error(err, "Query should fail")
		s.Nil(result, "Rows should be nil on error")

		s.NoError(mock.ExpectationsWereMet())
	}

	// Test query on disconnected database
	{
		db, _, cleanup := createMockDatabase(s.t)
		defer cleanup()

		db.db = nil

		result, err := db.Query("SELECT * FROM users WHERE 1=0")

		s.Error(err, "Query should fail when not connected")
		s.Nil(result, "Rows should be nil when not connected")
	}
}

// ========== DSN Builder Tests ==========

// TestBuildMySQLDSN tests building the MySQL data source name string
func (s *connectionTestSuite) TestBuildMySQLDSN() {
	tests := []struct {
		name     string
		config   *DBConfig
		expected string
	}{
		{
			name: "standard config",
			config: &DBConfig{
				User:         "testuser",
				Password:     "testpass",
				Host:         "localhost",
				Port:         3306,
				DatabaseName: "testdb",
			},
			expected: "testuser:testpass@tcp(localhost:3306)/testdb?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci&loc=UTC&time_zone=%27%2B00%3A00%27",
		},
		{
			name: "different host, port and credentials",
			config: &DBConfig{
				User:         "admin",
				Password:     "secret",
				Host:         "db.example.com",
				Port:         13306,
				DatabaseName: "flashcards",
			},
			expected: "admin:secret@tcp(db.example.com:13306)/flashcards?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci&loc=UTC&time_zone=%27%2B00%3A00%27",
		},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			db := NewUniversalDatabase(tt.config)
			s.Equal(tt.expected, db.buildMySQLDSN())
		})
	}
}

// ========== Connection Configuration Tests ==========

// TestConfigureConnection tests applying connection pool settings to the underlying *sql.DB
func (s *connectionTestSuite) TestConfigureConnection() {
	tests := []struct {
		name         string
		maxOpenConns int
		maxIdleConns int
	}{
		{name: "typical pool sizes", maxOpenConns: 25, maxIdleConns: 25},
		{name: "small pool sizes", maxOpenConns: 5, maxIdleConns: 2},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			db, _, cleanup := createMockDatabase(s.t)
			defer cleanup()

			db.config.MaxOpenConns = tt.maxOpenConns
			db.config.MaxIdleConns = tt.maxIdleConns

			db.configureConnection(db.db)

			s.Equal(tt.maxOpenConns, db.db.Stats().MaxOpenConnections)
		})
	}
}

// TestTranslateDatabaseTerms tests the translateDatabaseTerms method
func (s *connectionTestSuite) TestTranslateDatabaseTerms() {
	db, _, cleanup := createMockDatabase(s.t)
	defer cleanup()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "single pattern", input: "{FUNC_RANDOM}", expected: "RAND()"},
		{name: "pattern within larger string", input: "ORDER BY {FUNC_RANDOM}, id ASC", expected: "ORDER BY RAND(), id ASC"},
		{name: "multiple occurrences", input: "SELECT {FUNC_RANDOM} AS rand1, {FUNC_RANDOM} AS rand2", expected: "SELECT RAND() AS rand1, RAND() AS rand2"},
		{name: "string without patterns is unchanged", input: "ORDER BY name ASC", expected: "ORDER BY name ASC"},
	}

	for _, tt := range tests {
		s.Run(tt.name, func() {
			s.Equal(tt.expected, db.translateDatabaseTerms(tt.input))
		})
	}
}
