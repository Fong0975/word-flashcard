package database

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Masterminds/squirrel"
)

// TestUser represents a test user for integration testing
type TestUser struct {
	ID       int    `db:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Age      int    `json:"age"`
	IsActive bool   `json:"is_active"`
}

// TestDatabaseIntegration tests the complete CRUD workflow
func TestDatabaseIntegration(t *testing.T) {
	// Create mock database
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}
	defer mockDB.Close()

	config := createTestConfig()
	db := NewUniversalDatabase(config)
	db.db = mockDB

	// 1. Query (SELECT) - should return empty result initially
	emptyRows := sqlmock.NewRows([]string{"id", "name", "email", "age", "is_active"})
	mock.ExpectQuery("SELECT \\* FROM users").WillReturnRows(emptyRows)

	var results []TestUser // Initialize empty slice
	err = db.Select("users", nil, &results)
	if err != nil {
		t.Errorf("Initial Select failed: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("Expected 0 results initially, got %d", len(results))
	}

	// 2. Count - should return 0 initially
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM users").WillReturnRows(countRows)

	count, err := db.Count("users", nil)
	if err != nil {
		t.Errorf("Initial Count failed: %v", err)
	}
	if count != 0 {
		t.Errorf("Expected count=0 initially, got %d", count)
	}

	// 3. Insert (ADD) - add a new user
	testUser := TestUser{
		Name:     "John Doe",
		Email:    "john@example.com",
		Age:      30,
		IsActive: true,
	}

	mock.ExpectExec("INSERT INTO users").
		WillReturnResult(sqlmock.NewResult(1, 1))

	id, err := db.Insert("users", testUser)
	if err != nil {
		t.Errorf("Insert failed: %v", err)
	}
	if id != 1 {
		t.Errorf("Expected ID=1, got %d", id)
	}

	// 4. Query (SELECT) - should return the inserted user
	userRows := sqlmock.NewRows([]string{"id", "name", "email", "age", "is_active"}).
		AddRow(1, "John Doe", "john@example.com", 30, true)
	mock.ExpectQuery("SELECT \\* FROM users").WillReturnRows(userRows)

	results = []TestUser{} // Reset slice before query
	err = db.Select("users", nil, &results)
	if err != nil {
		t.Errorf("Select after insert failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("Expected 1 result after insert, got %d", len(results))
	}
	if len(results) > 0 && results[0].Name != "John Doe" {
		t.Errorf("Expected Name=John Doe, got %s", results[0].Name)
	}

	// 5. Count - should return 1 after insert
	countRows = sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM users").WillReturnRows(countRows)

	count, err = db.Count("users", nil)
	if err != nil {
		t.Errorf("Count after insert failed: %v", err)
	}
	if count != 1 {
		t.Errorf("Expected count=1 after insert, got %d", count)
	}

	// 6. Update - modify the user
	updateData := TestUser{
		Name:  "John Updated",
		Email: "john.updated@example.com",
		Age:   31,
	}

	mock.ExpectExec("UPDATE users SET").
		WillReturnResult(sqlmock.NewResult(0, 1))

	where := squirrel.Eq{"id": 1}
	rowsAffected, err := db.Update("users", updateData, where)
	if err != nil {
		t.Errorf("Update failed: %v", err)
	}
	if rowsAffected != 1 {
		t.Errorf("Expected 1 row affected by update, got %d", rowsAffected)
	}

	// 7. Query (SELECT) - should return the updated user
	updatedRows := sqlmock.NewRows([]string{"id", "name", "email", "age", "is_active"}).
		AddRow(1, "John Updated", "john.updated@example.com", 31, true)
	mock.ExpectQuery("SELECT \\* FROM users").WillReturnRows(updatedRows)

	results = []TestUser{} // Reset slice before query
	err = db.Select("users", nil, &results)
	if err != nil {
		t.Errorf("Select after update failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("Expected 1 result after update, got %d", len(results))
	}
	if len(results) > 0 && results[0].Name != "John Updated" {
		t.Errorf("Expected updated Name=John Updated, got %s", results[0].Name)
	}

	// 8. Delete - remove the user
	mock.ExpectExec("DELETE FROM users WHERE id = \\?").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	rowsAffected, err = db.Delete("users", where)
	if err != nil {
		t.Errorf("Delete failed: %v", err)
	}
	if rowsAffected != 1 {
		t.Errorf("Expected 1 row affected by delete, got %d", rowsAffected)
	}

	// 9. Query (SELECT) - should return empty result after delete
	emptyRowsAgain := sqlmock.NewRows([]string{"id", "name", "email", "age", "is_active"})
	mock.ExpectQuery("SELECT \\* FROM users").WillReturnRows(emptyRowsAgain)

	results = []TestUser{} // Reset slice before query
	err = db.Select("users", nil, &results)
	if err != nil {
		t.Errorf("Select after delete failed: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("Expected 0 results after delete, got %d", len(results))
	}

	// 10. Count - should return 0 after delete
	countRowsFinal := sqlmock.NewRows([]string{"count"}).AddRow(0)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM users").WillReturnRows(countRowsFinal)

	count, err = db.Count("users", nil)
	if err != nil {
		t.Errorf("Final Count failed: %v", err)
	}
	if count != 0 {
		t.Errorf("Expected count=0 after delete, got %d", count)
	}

	// Verify all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}