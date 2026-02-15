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
	tableSchema := map[string][]string{
		"words": {
			"id", "word", "familiarity", "created_at", "updated_at",
		},
		"word_definitions": {
			"id", "word_id", "part_of_speech", "definition", "phonetics", "examples", "notes", "created_at", "updated_at",
		},
		"questions": {
			"id", "question", "option_a", "option_b", "option_c", "option_d", "answer", "reference", "notes", "count_practise", "count_failure_practise", "created_at", "updated_at",
		},
	}

	for name := range tableSchema {
		exists := database.TableExists(name)
		if !exists {
			t.Error("Expected '" + name + "' table to be registered after RegisterAllTables()")
		}
	}

	// Verify we have exactly the expected number of tables
	tables := database.GetAllTables()
	expectedTableCount := len(tableSchema)
	if len(tables) != expectedTableCount {
		t.Errorf("Expected %d tables after RegisterAllTables(), got %d", expectedTableCount, len(tables))
	}

	// Verify specific table structures
	for name, columns := range tableSchema {
		table, exists := database.GetTable(name)

		// Check the table is exists
		if !exists {
			t.Fatal(name + " table should exist after registration")
		}

		// Check the columns in the table
		if len(table.Columns) != len(columns) {
			t.Errorf("Expected %d columns in "+name+" table, got %d", len(columns), len(table.Columns))
		}
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
	expectedTableCount := 3
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