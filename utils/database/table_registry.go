package database

import (
	"fmt"
	"sync"

	"word-flashcard/utils/database/domain"
)

// TableRegistry manages all table definitions in memory
type TableRegistry struct {
	tables map[string]*domain.TableDefinition
	mutex  sync.RWMutex
}

// Global registry instance
var registry = &TableRegistry{
	tables: make(map[string]*domain.TableDefinition),
}

// RegisterTable adds a table definition to the registry
func RegisterTable(table *domain.TableDefinition) error {
	registry.mutex.Lock()
	defer registry.mutex.Unlock()

	if table == nil {
		return fmt.Errorf("table definition cannot be nil")
	}

	if table.Name == "" {
		return fmt.Errorf("table name cannot be empty")
	}

	if len(table.Columns) == 0 {
		return fmt.Errorf("table must have at least one column")
	}

	registry.tables[table.Name] = table
	return nil
}

// GetTable retrieves a table definition by name
func GetTable(name string) (*domain.TableDefinition, bool) {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	table, exists := registry.tables[name]
	return table, exists
}

// GetAllTables returns all registered table definitions
func GetAllTables() map[string]*domain.TableDefinition {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	// Return a copy to prevent external modifications
	result := make(map[string]*domain.TableDefinition)
	for name, table := range registry.tables {
		result[name] = table
	}

	return result
}

// ListTableNames returns all registered table names
func ListTableNames() []string {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	names := make([]string, 0, len(registry.tables))
	for name := range registry.tables {
		names = append(names, name)
	}

	return names
}

// TableExists checks if a table is registered
func TableExists(name string) bool {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	_, exists := registry.tables[name]
	return exists
}

// ClearRegistry removes all table definitions (mainly for testing)
func ClearRegistry() {
	registry.mutex.Lock()
	defer registry.mutex.Unlock()

	registry.tables = make(map[string]*domain.TableDefinition)
}
