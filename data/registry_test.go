package data

import (
	"testing"

	"word-flashcard/utils/database"
)

// setupCleanRegistry ensures a clean registry state for testing
func setupCleanRegistry() {
	database.ClearRegistry()
}

// Test registering all tables from data layer
func TestRegisterAllTables(t *testing.T) {
	setupCleanRegistry()

	// Call RegisterAllTables to register all predefined tables
	RegisterAllTables()

	// Verify that both words and word_definitions tables are registered
	exists := database.TableExists("words")
	if !exists {
		t.Error("Expected 'words' table to be registered after RegisterAllTables()")
	}

	exists = database.TableExists("word_definitions")
	if !exists {
		t.Error("Expected 'word_definitions' table to be registered after RegisterAllTables()")
	}

	// Verify we have exactly the expected number of tables
	tables := database.GetAllTables()
	expectedTableCount := 2 // words + word_definitions
	if len(tables) != expectedTableCount {
		t.Errorf("Expected %d tables after RegisterAllTables(), got %d", expectedTableCount, len(tables))
	}

	// Verify specific table structures
	wordsTable, exists := database.GetTable("words")
	if !exists {
		t.Fatal("words table should exist after registration")
	}

	// Check words table has expected columns
	expectedWordsColumns := []string{"id", "word", "familiarity", "created_at", "updated_at"}
	if len(wordsTable.Columns) != len(expectedWordsColumns) {
		t.Errorf("Expected %d columns in words table, got %d", len(expectedWordsColumns), len(wordsTable.Columns))
	}

	// Verify word_definitions table structure
	definitionsTable, exists := database.GetTable("word_definitions")
	if !exists {
		t.Fatal("word_definitions table should exist after registration")
	}

	expectedDefinitionsColumns := []string{"id", "word_id", "part_of_speech", "definition", "phonetics", "examples", "notes", "created_at", "updated_at"}
	if len(definitionsTable.Columns) != len(expectedDefinitionsColumns) {
		t.Errorf("Expected %d columns in word_definitions table, got %d", len(expectedDefinitionsColumns), len(definitionsTable.Columns))
	}
}

// Test that tables are properly structured
func TestTableStructures(t *testing.T) {
	setupCleanRegistry()
	RegisterAllTables()

	// Test words table structure
	wordsTable, exists := database.GetTable("words")
	if !exists {
		t.Fatal("words table should exist")
	}

	// Check for primary key
	foundPrimaryKey := false
	for _, col := range wordsTable.Columns {
		if col.PrimaryKey {
			foundPrimaryKey = true
			if col.Name != "id" {
				t.Errorf("Expected primary key column to be 'id', got '%s'", col.Name)
			}
		}
	}
	if !foundPrimaryKey {
		t.Error("words table should have a primary key column")
	}

	// Check for unique constraints
	if len(wordsTable.Indexes) == 0 {
		t.Error("words table should have indexes defined")
	}

	// Test word_definitions table structure
	definitionsTable, exists := database.GetTable("word_definitions")
	if !exists {
		t.Fatal("word_definitions table should exist")
	}

	// Check for foreign key column
	foundWordIDColumn := false
	for _, col := range definitionsTable.Columns {
		if col.Name == "word_id" {
			foundWordIDColumn = true
		}
	}
	if !foundWordIDColumn {
		t.Error("word_definitions table should have word_id column")
	}
}

// Test multiple registrations don't cause conflicts
func TestMultipleRegistrations(t *testing.T) {
	setupCleanRegistry()

	// Register tables multiple times
	RegisterAllTables()
	RegisterAllTables()

	// Should still have the same number of tables
	tables := database.GetAllTables()
	expectedTableCount := 2
	if len(tables) != expectedTableCount {
		t.Errorf("Expected %d tables after multiple registrations, got %d", expectedTableCount, len(tables))
	}

	// Verify tables are still functional
	exists := database.TableExists("words")
	if !exists {
		t.Error("words table should still exist after multiple registrations")
	}

	exists = database.TableExists("word_definitions")
	if !exists {
		t.Error("word_definitions table should still exist after multiple registrations")
	}
}