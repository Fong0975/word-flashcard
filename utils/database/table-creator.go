package database

import (
	"fmt"
	"log/slog"
	"strings"

	"word-flashcard/utils/database/domain"
)

// CreateDatabaseTables creates all registered tables in the database
func CreateDatabaseTables(db Database, dbType string, tablePrefix string) error {
	tables := GetAllTables()

	slog.Info("Initializing database tables", "count", len(tables))

	for tableName, tableDef := range tables {
		fullTableName := tablePrefix + tableDef.Name

		// Check if table already exists
		exists, err := tableExists(db, fullTableName, dbType)
		if err != nil {
			return fmt.Errorf("failed to check if table %s exists: %v", tableName, err)
		}

		if exists {
			slog.Debug("Table already exists, skipping creation", "table", tableName)
		} else {
			// Generate CREATE TABLE SQL
			createSQL := GetCreateSQL(tableDef, dbType, tablePrefix)

			// Execute CREATE TABLE
			_, err := db.Exec(createSQL)
			if err != nil {
				return fmt.Errorf("failed to create table %s: %v", tableName, err)
			}

			slog.Info("Table created successfully", "table", tableName)
		}

		// Create indexes (even if table already exists, indexes might be new)
		indexSQLs := GetIndexSQL(tableDef, dbType, tablePrefix)
		for _, indexSQL := range indexSQLs {
			_, err := db.Exec(indexSQL)
			if err != nil {
				slog.Warn("Failed to create index for table", "table", tableName, "error", err)
				// Don't fail on index creation errors, just warn
			}
		}
	}

	slog.Info("Database tables initialized successfully")
	return nil
}

// GetCreateSQL generates CREATE TABLE SQL for the specified database type
func GetCreateSQL(td *domain.TableDefinition, dbType, tablePrefix string) string {
	var columns []string

	// Add columns
	for _, col := range td.Columns {
		columnSQL := buildColumnSQL(col, dbType)
		columns = append(columns, columnSQL)
	}

	// Add primary key constraint if not already defined in column
	pkColumns := getPrimaryKeyColumns(td.Columns)
	if len(pkColumns) > 1 {
		columns = append(columns, fmt.Sprintf("PRIMARY KEY (%s)",
			strings.Join(pkColumns, ", ")))
	}

	tableName := tablePrefix + td.Name
	return fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (\n    %s\n)",
		tableName, strings.Join(columns, ",\n    "))
}

// buildColumnSQL builds SQL for a single column
func buildColumnSQL(col domain.Column, dbType string) string {
	var parts []string

	// Column name and type
	var colType string
	switch dbType {
	case "mysql":
		colType = col.Type.MySQL
	case "postgresql":
		colType = col.Type.PostgreSQL
	default:
		colType = col.Type.MySQL
	}

	parts = append(parts, col.Name, colType)

	// Auto increment
	if col.AutoIncrement {
		if dbType == "mysql" {
			parts = append(parts, "AUTO_INCREMENT")
		} else if dbType == "postgresql" {
			// PostgreSQL uses SERIAL for auto increment
			if colType == "INTEGER" {
				parts[1] = "SERIAL"
			} else if colType == "BIGINT" {
				parts[1] = "BIGSERIAL"
			}
		}
	}

	// Not null constraint
	if col.NotNull {
		parts = append(parts, "NOT NULL")
	}

	// Default value
	if col.Default != "" {
		if strings.Contains(col.Default, "ON UPDATE") && dbType == "postgresql" {
			// PostgreSQL doesn't support ON UPDATE, use only CURRENT_TIMESTAMP
			parts = append(parts, "DEFAULT", "CURRENT_TIMESTAMP")
		} else {
			parts = append(parts, "DEFAULT", col.Default)
		}
	}

	// Primary key (for single column)
	if col.PrimaryKey {
		parts = append(parts, "PRIMARY KEY")
	}

	// Unique constraint
	if col.Unique {
		parts = append(parts, "UNIQUE")
	}

	return strings.Join(parts, " ")
}

// getPrimaryKeyColumns returns list of primary key column names
func getPrimaryKeyColumns(columns []domain.Column) []string {
	var pkColumns []string
	for _, col := range columns {
		if col.PrimaryKey {
			pkColumns = append(pkColumns, col.Name)
		}
	}
	return pkColumns
}

// GetIndexSQL generates CREATE INDEX SQL statements
func GetIndexSQL(td *domain.TableDefinition, dbType, tablePrefix string) []string {
	var indexSQLs []string
	tableName := tablePrefix + td.Name

	for _, idx := range td.Indexes {
		var sql string
		indexName := fmt.Sprintf("idx_%s_%s", td.Name, idx.Name)

		if idx.Unique {
			sql = fmt.Sprintf("CREATE UNIQUE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, tableName, strings.Join(idx.Columns, ", "))
		} else {
			sql = fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, tableName, strings.Join(idx.Columns, ", "))
		}

		indexSQLs = append(indexSQLs, sql)
	}

	return indexSQLs
}

// tableExists checks if a table exists in the database
func tableExists(db Database, tableName string, dbType string) (bool, error) {
	// Try to execute a query that would fail if table doesn't exist
	checkQuery := fmt.Sprintf("SELECT 1 FROM %s WHERE 1=0", tableName)
	_, err := db.Exec(checkQuery)

	if err != nil {
		// If error contains "doesn't exist" or similar, table doesn't exist
		errorMsg := strings.ToLower(err.Error())
		if strings.Contains(errorMsg, "doesn't exist") ||
			strings.Contains(errorMsg, "does not exist") ||
			strings.Contains(errorMsg, "relation") && strings.Contains(errorMsg, "does not exist") {
			return false, nil
		}
		// Other error, return it
		return false, err
	}

	// Query succeeded, table exists
	return true, nil
}
