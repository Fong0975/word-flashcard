package database

import (
	"database/sql"
	"reflect"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

// Test struct for structToMap tests
type TestStruct struct {
	ID          int       `db:"id"`
	Name        string    `json:"name"`
	Email       string    `db:"email_address"`
	Age         int       `json:"age"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
	IsActive    bool      `json:"is_active"`
	Description string
}

// Test converting struct to map
func TestStructToMap(t *testing.T) {
	// Test with nil input
	result, err := structToMap(nil)
	if err != nil {
		t.Errorf("structToMap(nil) returned error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("Expected empty map for nil input, got %v", result)
	}

	// Test with map input
	inputMap := map[string]interface{}{
		"key1": "value1",
		"key2": 123,
	}
	result, err = structToMap(inputMap)
	if err != nil {
		t.Errorf("structToMap(map) returned error: %v", err)
	}
	if !reflect.DeepEqual(result, inputMap) {
		t.Errorf("Expected %v, got %v", inputMap, result)
	}

	// Test with valid struct
	testStruct := TestStruct{
		ID:          1,
		Name:        "John Doe",
		Email:       "john@example.com",
		Age:         30,
		IsActive:    true,
		Description: "Test description",
	}
	result, err = structToMap(testStruct)
	if err != nil {
		t.Errorf("structToMap(struct) returned error: %v", err)
	}

	expectedKeys := []string{"name", "email_address", "age", "is_active", "description"}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected key %s not found in result", key)
		}
	}

	// Check that auto-generated fields are excluded
	excludedKeys := []string{"id", "created_at", "updated_at"}
	for _, key := range excludedKeys {
		if _, exists := result[key]; exists {
			t.Errorf("Auto-generated key %s should be excluded from result", key)
		}
	}

	// Test with pointer to struct
	result, err = structToMap(&testStruct)
	if err != nil {
		t.Errorf("structToMap(pointer) returned error: %v", err)
	}
	for _, key := range expectedKeys {
		if _, exists := result[key]; !exists {
			t.Errorf("Expected key %s not found in result for pointer", key)
		}
	}

	// Test with invalid type
	_, err = structToMap("string")
	if err == nil {
		t.Error("Expected error for string input, got nil")
	}
}

// Test camelCase to snake_case conversion
func TestCamelToSnake(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"CamelCase", "camel_case"},
		{"XMLHttpRequest", "x_m_l_http_request"},
		{"ID", "i_d"},
		{"UserID", "user_i_d"},
		{"firstName", "first_name"},
		{"HTMLParser", "h_t_m_l_parser"},
		{"simple", "simple"},
		{"", ""},
	}

	for _, test := range tests {
		result := camelToSnake(test.input)
		if result != test.expected {
			t.Errorf("camelToSnake(%s) = %s, expected %s", test.input, result, test.expected)
		}
	}
}

// Test snake_case to CamelCase conversion
func TestSnakeToCamel(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"snake_case", "SnakeCase"},
		{"user_id", "UserId"},
		{"first_name", "FirstName"},
		{"xml_http_request", "XmlHttpRequest"},
		{"simple", "Simple"},
		{"", ""},
		{"_leading_underscore", "LeadingUnderscore"},
		{"trailing_underscore_", "TrailingUnderscore"},
	}

	for _, test := range tests {
		result := snakeToCamel(test.input)
		if result != test.expected {
			t.Errorf("snakeToCamel(%s) = %s, expected %s", test.input, result, test.expected)
		}
	}
}

// Test scanning sql.Rows to struct slice
func TestScanToStruct(t *testing.T) {
	// Create mock database and rows
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}
	defer db.Close()

	// Prepare test data - using column names that match struct fields after snakeToCamel conversion
	rows := sqlmock.NewRows([]string{"id", "name", "email", "age", "is_active"}).
		AddRow(1, "John Doe", "john@example.com", 30, true).
		AddRow(2, "Jane Smith", "jane@example.com", 25, false)

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	// Execute query to get sql.Rows
	sqlRows, err := db.Query("SELECT id, name, email, age, is_active FROM test_table")
	if err != nil {
		t.Fatalf("Failed to execute query: %v", err)
	}
	defer sqlRows.Close()

	// Test scanning to struct slice
	var results []TestStruct
	err = scanToStruct(sqlRows, &results)
	if err != nil {
		t.Errorf("scanToStruct() returned error: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 results, got %d", len(results))
	}

	// Verify first result
	if results[0].Name != "John Doe" {
		t.Errorf("Expected Name=John Doe, got %s", results[0].Name)
	}
	if results[0].Email != "john@example.com" {
		t.Errorf("Expected Email=john@example.com, got %s", results[0].Email)
	}

	// Test with invalid destination (not a pointer)
	var invalidDest []TestStruct
	err = scanToStruct(sqlRows, invalidDest)
	if err == nil {
		t.Error("Expected error for non-pointer destination, got nil")
	}

	// Test with invalid destination (not a slice)
	var notSlice string
	err = scanToStruct(sqlRows, &notSlice)
	if err == nil {
		t.Error("Expected error for non-slice destination, got nil")
	}
}

// Test error wrapping for database errors
func TestNewDatabaseError(t *testing.T) {
	operation := "test_operation"
	originalErr := sql.ErrNoRows

	dbErr := NewDatabaseError(operation, originalErr)

	if dbErr.Operation != operation {
		t.Errorf("Expected Operation=%s, got %s", operation, dbErr.Operation)
	}

	if dbErr.Err != originalErr {
		t.Errorf("Expected Err=%v, got %v", originalErr, dbErr.Err)
	}

	expectedErrorMsg := "database test_operation error: sql: no rows in result set"
	if dbErr.Error() != expectedErrorMsg {
		t.Errorf("Expected error message=%s, got %s", expectedErrorMsg, dbErr.Error())
	}
}

// Test BaseDatabase initialization and table name generation
func TestNewBaseDatabase(t *testing.T) {
	config := &Config{
		Type:         "mysql",
		Host:         "localhost",
		Port:         3306,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		TablePrefix:  "test_",
	}

	base := NewBaseDatabase(config, nil)

	if base == nil {
		t.Error("Expected non-nil BaseDatabase instance")
	}

	if base.config != config {
		t.Error("Expected config to be set correctly")
	}
}

// Test table name generation with prefix
func TestGetTableName(t *testing.T) {
	config := &Config{
		TablePrefix: "wfc_",
	}

	base := NewBaseDatabase(config, nil)

	tableName := base.getTableName("users")
	expectedTableName := "wfc_users"

	if tableName != expectedTableName {
		t.Errorf("Expected table name=%s, got %s", expectedTableName, tableName)
	}
}