package database

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Masterminds/squirrel"
)

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

// Test create different type of database connections
func TestNewUniversalDatabase(t *testing.T) {
	// Test with MySQL config
	mysqlConfig := createTestConfig()
	db := NewUniversalDatabase(mysqlConfig)
	if db == nil {
		t.Error("Expected non-nil UniversalDatabase for MySQL config")
	}

	// Test with PostgreSQL config
	postgresConfig := createPostgreSQLTestConfig()
	db = NewUniversalDatabase(postgresConfig)
	if db == nil {
		t.Error("Expected non-nil UniversalDatabase for PostgreSQL config")
	}

	// Test with unsupported database type
	unknownConfig := createTestConfig()
	unknownConfig.Type = "unknown"
	db = NewUniversalDatabase(unknownConfig)
	if db == nil {
		t.Error("Expected non-nil UniversalDatabase even for unknown type (should default to MySQL format)")
	}
}

// Test MySQL connection string building
func TestBuildMySQLDSN(t *testing.T) {
	config := createTestConfig()
	db := NewUniversalDatabase(config)
	dsn := db.buildMySQLDSN()

	expected := "testuser:testpass@tcp(localhost:3306)/testdb?parseTime=true"
	if dsn != expected {
		t.Errorf("Expected DSN=%s, got %s", expected, dsn)
	}
}

// Test PostgreSQL connection string building
func TestBuildPostgreSQLDSN(t *testing.T) {
	config := createPostgreSQLTestConfig()
	db := NewUniversalDatabase(config)
	dsn := db.buildPostgreSQLDSN()

	expected := "host=localhost port=5432 user=testuser password=testpass dbname=testdb sslmode=disable"
	if dsn != expected {
		t.Errorf("Expected DSN=%s, got %s", expected, dsn)
	}
}

// Test Select feature
func TestSelectWithMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	// Setup expectations
	rows := sqlmock.NewRows([]string{"id", "name", "email"}).
		AddRow(1, "John Doe", "john@example.com").
		AddRow(2, "Jane Smith", "jane@example.com")

	mock.ExpectQuery("SELECT \\* FROM users").WillReturnRows(rows)

	// Execute test
	var results []TestStruct
	err := db.Select("users", nil, &results)
	if err != nil {
		t.Errorf("Select() failed: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 results, got %d", len(results))
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Select with where condition
func TestSelectWithWhereCondition(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	rows := sqlmock.NewRows([]string{"id", "name", "email"}).
		AddRow(1, "John Doe", "john@example.com")

	mock.ExpectQuery("SELECT \\* FROM users WHERE id = \\?").
		WithArgs(1).
		WillReturnRows(rows)

	var results []TestStruct
	where := squirrel.Eq{"id": 1}
	err := db.Select("users", where, &results)
	if err != nil {
		t.Errorf("Select() with where condition failed: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Insert feature (MySQL)
func TestInsertWithMySQLMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	testData := TestStruct{
		Name:        "John Doe",
		Email:       "john@example.com",
		Age:         30,
		IsActive:    true,
		Description: "Test user",
	}

	mock.ExpectExec("INSERT INTO users").
		WillReturnResult(sqlmock.NewResult(1, 1))

	id, err := db.Insert("users", testData)
	if err != nil {
		t.Errorf("Insert() failed: %v", err)
	}

	if id != 1 {
		t.Errorf("Expected ID=1, got %d", id)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Insert feature (PostgreSQL)
func TestInsertWithPostgreSQLMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "postgresql")
	defer cleanup()

	testData := TestStruct{
		Name:        "John Doe",
		Email:       "john@example.com",
		Age:         30,
		IsActive:    true,
		Description: "Test user",
	}

	mock.ExpectQuery("INSERT INTO users .* RETURNING id").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	id, err := db.Insert("users", testData)
	if err != nil {
		t.Errorf("Insert() failed: %v", err)
	}

	if id != 1 {
		t.Errorf("Expected ID=1, got %d", id)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Update feature
func TestUpdateWithMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	updateData := TestStruct{
		Name:  "Updated Name",
		Email: "updated@example.com",
	}

	mock.ExpectExec("UPDATE users SET").
		WillReturnResult(sqlmock.NewResult(0, 1))

	where := squirrel.Eq{"id": 1}
	rowsAffected, err := db.Update("users", updateData, where)
	if err != nil {
		t.Errorf("Update() failed: %v", err)
	}

	if rowsAffected != 1 {
		t.Errorf("Expected rowsAffected=1, got %d", rowsAffected)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Delete feature
func TestDeleteWithMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	mock.ExpectExec("DELETE FROM users WHERE id = \\?").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	where := squirrel.Eq{"id": 1}
	rowsAffected, err := db.Delete("users", where)
	if err != nil {
		t.Errorf("Delete() failed: %v", err)
	}

	if rowsAffected != 1 {
		t.Errorf("Expected rowsAffected=1, got %d", rowsAffected)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Count feature
func TestCountWithMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	rows := sqlmock.NewRows([]string{"count"}).AddRow(5)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM users").WillReturnRows(rows)

	count, err := db.Count("users", nil)
	if err != nil {
		t.Errorf("Count() failed: %v", err)
	}

	if count != 5 {
		t.Errorf("Expected count=5, got %d", count)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Exec feature - general query execution
func TestExecWithMockDB(t *testing.T) {
	db, mock, cleanup := createMockDatabase(t, "mysql")
	defer cleanup()

	mock.ExpectExec("CREATE TABLE test").WillReturnResult(sqlmock.NewResult(0, 0))

	result, err := db.Exec("CREATE TABLE test (id INT PRIMARY KEY)")
	if err != nil {
		t.Errorf("Exec() failed: %v", err)
	}

	if result == nil {
		t.Error("Expected non-nil result from Exec()")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

// Test Close connection
func TestCloseDatabase(t *testing.T) {
	// Create mock database without using createMockDatabase to avoid cleanup conflicts
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}

	config := createTestConfig()
	db := NewUniversalDatabase(config)
	db.db = mockDB

	// Set expectation for Close call
	mock.ExpectClose()

	// Test closing the connection
	err = db.Close()
	if err != nil {
		t.Errorf("Close() failed: %v", err)
	}

	// Verify expectations
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}

	// Test closing when db is nil
	db.db = nil
	err = db.Close()
	if err != nil {
		t.Errorf("Close() failed when db is nil: %v", err)
	}
}

// Test operations without an active connection
func TestOperationsWithoutConnection(t *testing.T) {
	config := createTestConfig()
	db := NewUniversalDatabase(config)

	// Test Select without connection
	var results []TestStruct
	err := db.Select("users", nil, &results)
	if err == nil {
		t.Error("Expected error for Select() without connection, got nil")
	}

	// Test Insert without connection
	_, err = db.Insert("users", TestStruct{Name: "test"})
	if err == nil {
		t.Error("Expected error for Insert() without connection, got nil")
	}

	// Test Update without connection
	_, err = db.Update("users", TestStruct{Name: "test"}, nil)
	if err == nil {
		t.Error("Expected error for Update() without connection, got nil")
	}

	// Test Delete without connection
	_, err = db.Delete("users", nil)
	if err == nil {
		t.Error("Expected error for Delete() without connection, got nil")
	}

	// Test Count without connection
	_, err = db.Count("users", nil)
	if err == nil {
		t.Error("Expected error for Count() without connection, got nil")
	}

	// Test Exec without connection
	_, err = db.Exec("SELECT 1")
	if err == nil {
		t.Error("Expected error for Exec() without connection, got nil")
	}

	// Test InitializeTables without connection
	err = db.InitializeTables()
	if err == nil {
		t.Error("Expected error for InitializeTables() without connection, got nil")
	}
}