package database

import (
	"testing"

	"word-flashcard/utils/database/domain"

	"github.com/stretchr/testify/suite"
)

// tableRegistryTestSuite testing suite components
type tableRegistryTestSuite struct {
	suite.Suite
	t *testing.T
}

// TestFactorySuite runs the test suite
func TestTableRegistrySuite(t *testing.T) {
	suite.Run(t, new(tableRegistryTestSuite))
}

// SetupTest for the test suite
func (s *tableRegistryTestSuite) SetupTest() {
	s.t = s.T()

	// ensures a clean registry state for testing
	ClearRegistry()
}

// createTestTableDefinition creates a test table definition for testing
func createTestTableDefinition() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: "test_users",
		Columns: []domain.Column{
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
				Name: "email",
				Type: domain.ColumnType{MySQL: "VARCHAR(255)", PostgreSQL: "VARCHAR(255)"},
				Unique: true,
			},
		},
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

// Test table registration
func (suite *tableRegistryTestSuite) TestRegisterTable() {
	testTable := createTestTableDefinition()

	// Test successful registration
	err := RegisterTable(testTable)
	if err != nil {
		suite.t.Errorf("RegisterTable() failed: %v", err)
	}

	// Verify table was registered
	retrievedTable, exists := GetTable("test_users")
	if !exists {
		suite.t.Error("Table was not found after registration")
	}
	if retrievedTable.Name != testTable.Name {
		suite.t.Errorf("Expected table name=%s, got %s", testTable.Name, retrievedTable.Name)
	}

	// Test registration with nil table
	err = RegisterTable(nil)
	if err == nil {
		suite.t.Error("Expected error for nil table, got nil")
	}

	// Test registration with empty table name
	emptyNameTable := createTestTableDefinition()
	emptyNameTable.Name = ""
	err = RegisterTable(emptyNameTable)
	if err == nil {
		suite.t.Error("Expected error for empty table name, got nil")
	}

	// Test registration with no columns
	noColumnsTable := createTestTableDefinition()
	noColumnsTable.Columns = []domain.Column{}
	err = RegisterTable(noColumnsTable)
	if err == nil {
		suite.t.Error("Expected error for table with no columns, got nil")
	}
}

// Test getting a table by name
func (suite *tableRegistryTestSuite) TestGetTable() {
	testTable := createTestTableDefinition()
	RegisterTable(testTable)

	// Test getting existing table
	retrievedTable, exists := GetTable("test_users")
	if !exists {
		suite.t.Error("Expected table to exist")
	}
	if retrievedTable.Name != testTable.Name {
		suite.t.Errorf("Expected table name=%s, got %s", testTable.Name, retrievedTable.Name)
	}

	// Test getting non-existing table
	_, exists = GetTable("non_existing_table")
	if exists {
		suite.t.Error("Expected table not to exist")
	}
}

// Test getting all registered tables
func (suite *tableRegistryTestSuite) TestGetAllTables() {
	// Test empty registry
	tables := GetAllTables()
	if len(tables) != 0 {
		suite.t.Errorf("Expected 0 tables in empty registry, got %d", len(tables))
	}

	// Register multiple tables
	testTable1 := createTestTableDefinition()
	testTable1.Name = "table1"
	RegisterTable(testTable1)

	testTable2 := createTestTableDefinition()
	testTable2.Name = "table2"
	RegisterTable(testTable2)

	// Test getting all tables
	tables = GetAllTables()
	if len(tables) != 2 {
		suite.t.Errorf("Expected 2 tables, got %d", len(tables))
	}

	// Verify tables exist
	if _, exists := tables["table1"]; !exists {
		suite.t.Error("table1 not found in GetAllTables result")
	}
	if _, exists := tables["table2"]; !exists {
		suite.t.Error("table2 not found in GetAllTables result")
	}

	// Verify returned map is a copy (external modifications should not affect registry)
	delete(tables, "table1")
	tablesAfterModification := GetAllTables()
	if len(tablesAfterModification) != 2 {
		suite.t.Error("GetAllTables() should return a copy, not the original map")
	}
}

// Test listing all registered table names
func (suite *tableRegistryTestSuite) TestListTableNames() {
	// Test empty registry
	names := ListTableNames()
	if len(names) != 0 {
		suite.t.Errorf("Expected 0 table names in empty registry, got %d", len(names))
	}

	// Register tables
	testTable1 := createTestTableDefinition()
	testTable1.Name = "users"
	RegisterTable(testTable1)

	testTable2 := createTestTableDefinition()
	testTable2.Name = "products"
	RegisterTable(testTable2)

	// Test getting table names
	names = ListTableNames()
	if len(names) != 2 {
		suite.t.Errorf("Expected 2 table names, got %d", len(names))
	}

	// Verify names are present (order is not guaranteed with maps)
	foundUsers := false
	foundProducts := false
	for _, name := range names {
		if name == "users" {
			foundUsers = true
		}
		if name == "products" {
			foundProducts = true
		}
	}

	if !foundUsers {
		suite.t.Error("Table name 'users' not found in ListTableNames result")
	}
	if !foundProducts {
		suite.t.Error("Table name 'products' not found in ListTableNames result")
	}
}

// Test checking if a table exists in registry
func (suite *tableRegistryTestSuite) TestTableExistsInRegistry() {
	testTable := createTestTableDefinition()
	RegisterTable(testTable)

	// Test existing table
	exists := TableExists("test_users")
	if !exists {
		suite.t.Error("Expected TableExists to return true for registered table")
	}

	// Test non-existing table
	exists = TableExists("non_existing_table")
	if exists {
		suite.t.Error("Expected TableExists to return false for non-registered table")
	}
}

// Test clearing the registry
func (suite *tableRegistryTestSuite) TestClearRegistry() {
	// Register some tables
	testTable1 := createTestTableDefinition()
	testTable1.Name = "table1"
	RegisterTable(testTable1)

	testTable2 := createTestTableDefinition()
	testTable2.Name = "table2"
	RegisterTable(testTable2)

	// Verify tables are registered
	if len(GetAllTables()) != 2 {
		suite.t.Error("Tables were not properly registered")
	}

	// Clear registry
	ClearRegistry()

	// Verify registry is empty
	tables := GetAllTables()
	if len(tables) != 0 {
		suite.t.Errorf("Expected empty registry after ClearRegistry(), got %d tables", len(tables))
	}

	names := ListTableNames()
	if len(names) != 0 {
		suite.t.Errorf("Expected empty table names after ClearRegistry(), got %d names", len(names))
	}
}


// Test concurrent access to the registry
func (suite *tableRegistryTestSuite) TestConcurrentAccess() {
	// This test verifies that concurrent operations don't cause race conditions
	// The implementation uses sync.RWMutex, so this should be safe

	done := make(chan bool, 2)

	// Goroutine 1: Register tables
	go func() {
		for i := 0; i < 10; i++ {
			table := createTestTableDefinition()
			table.Name = "concurrent_table_" + string(rune('0'+i))
			RegisterTable(table)
		}
		done <- true
	}()

	// Goroutine 2: Read tables
	go func() {
		for i := 0; i < 10; i++ {
			GetAllTables()
			ListTableNames()
		}
		done <- true
	}()

	// Wait for both goroutines to complete
	<-done
	<-done

	// Verify final state
	tables := GetAllTables()
	if len(tables) != 10 {
		suite.t.Errorf("Expected 10 tables after concurrent operations, got %d", len(tables))
	}
}