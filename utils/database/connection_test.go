package database

import (
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
		Type:         "mysql",
		Host:         "localhost",
		Port:         3306,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		SSLMode:      "disable",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}
}

// createPostgreSQLTestConfig creates a PostgreSQL test configuration
func createPostgreSQLTestConfig() *DBConfig {
	config := createTestConfig()
	config.Type = "postgresql"
	config.Port = 5432
	return config
}

// createMockDatabase creates a UniversalDatabase with mock SQL connection
func createMockDatabase(t *testing.T, dbType string) (*UniversalDatabase, sqlmock.Sqlmock, func()) {
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}

	config := createTestConfig()
	if dbType == "postgresql" {
		config = createPostgreSQLTestConfig()
	}

	db := NewUniversalDatabase(config)
	db.db = mockDB

	cleanup := func() {
		mockDB.Close()
	}

	return db, mock, cleanup
}

// ========== Connection Management Tests ==========

// TestConnect tests successful database connection and disconnection
func (s *connectionTestSuite) TestConnect() {
	db, mock, _ := createMockDatabase(s.t, "mysql")

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

// TestSelect tests selecting records from database
func (s *connectionTestSuite) TestSelect() {
	db, mock, cleanup := createMockDatabase(s.t, "mysql")
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
	err := db.Select("users", nil, nil, orderBy, &results)

	s.NoError(err, "Select should succeed")
	s.Len(results, 2, "Should return 2 users")
	s.Equal(1, results[0].Id)
	s.Equal("Test User 1", results[0].Name)
	s.Equal(2, results[1].Id)
	s.Equal("Test User 2", results[1].Name)

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestInsert tests inserting records into database
func (s *connectionTestSuite) TestInsert() {
	db, mock, cleanup := createMockDatabase(s.t, "mysql")
	defer cleanup()

	// Test data to insert
	testData := testUser{
		Name: "New User",
	}

	// Mock expects an INSERT query
	mock.ExpectExec("INSERT INTO users").
		WithArgs("New User").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock expects a SELECT query to get the inserted ID
	rows := sqlmock.NewRows([]string{"id"}).AddRow(1)
	mock.ExpectQuery("SELECT id FROM users").
		WithArgs("New User").
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
	db, mock, cleanup := createMockDatabase(s.t, "mysql")
	defer cleanup()

	// Test data to update
	updateData := testUser{
		Name: "Updated User",
	}

	// Create where condition
	whereCondition := squirrel.Eq{"id": 1}

	// Mock expects an UPDATE query
	// Note: The Update method automatically adds updated_at field
	mock.ExpectExec("UPDATE users SET").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Test Update method
	rowsAffected, err := db.Update("users", updateData, whereCondition)

	s.NoError(err, "Update should succeed")
	s.Equal(int64(1), rowsAffected, "Should return 1 affected row")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// TestDelete tests deleting records from database
func (s *connectionTestSuite) TestDelete() {
	db, mock, cleanup := createMockDatabase(s.t, "mysql")
	defer cleanup()

	// Create where condition
	whereCondition := squirrel.Eq{"id": 1}

	// Mock expects a DELETE query
	mock.ExpectExec("DELETE FROM users").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Test Delete method
	rowsAffected, err := db.Delete("users", whereCondition)

	s.NoError(err, "Delete should succeed")
	s.Equal(int64(1), rowsAffected, "Should return 1 affected row")

	// Verify all expectations were met
	s.NoError(mock.ExpectationsWereMet())
}

// ========== Low-level Operations Tests ==========

// TestExec tests executing raw SQL queries
func (s *connectionTestSuite) TestExec() {
	db, mock, cleanup := createMockDatabase(s.t, "mysql")
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
