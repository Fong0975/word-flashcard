package data

import (
	"log/slog"

	"word-flashcard/data/schema"
	"word-flashcard/utils/database"
	"word-flashcard/utils/database/domain"
)

// RegisterAllTables registers all table definitions from the data layer
// This function should be called during database initialization
func RegisterAllTables() {
	tables := []*domain.TableDefinition{
		schema.WordsTable(),
		schema.WordDefinitionsTable(),
		schema.QuestionsTable(),
	}

	for _, table := range tables {
		if err := database.RegisterTable(table); err != nil {
			slog.Error("Failed to register table", "table", table.Name, "error", err)
		} else {
			slog.Debug("Successfully registered table", "table", table.Name)
		}
	}

	slog.Info("All data layer tables registered successfully")
}
