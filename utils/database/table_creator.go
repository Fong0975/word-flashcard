package database

import (
	"fmt"
	"log/slog"
	"strings"

	"word-flashcard/utils/database/domain"
)

// CreateDatabaseTables creates all registered tables in the database
func CreateDatabaseTables(db Database) error {
	tables := GetAllTables()

	slog.Info("Initializing database tables", "count", len(tables))

	for tableName, tableDef := range tables {
		// Check if table already exists
		exists, err := tableExists(db, tableDef.Name)
		if err != nil {
			return fmt.Errorf("failed to check if table %s exists: %v", tableName, err)
		}

		if exists {
			slog.Debug("Table already exists, syncing columns", "table", tableName)
			if err := syncMissingColumns(db, tableDef); err != nil {
				return fmt.Errorf("failed to sync columns for table %s: %v", tableName, err)
			}
		} else {
			// Generate CREATE TABLE SQL
			createSQL := GetCreateSQL(tableDef)

			// Execute CREATE TABLE
			_, err := db.Exec(createSQL)
			if err != nil {
				return fmt.Errorf("failed to create table %s: %v", tableName, err)
			}

			slog.Info("Table created successfully", "table", tableName)
		}

		// Create indexes (even if table already exists, indexes might be new)
		indexSQLs := GetIndexSQL(tableDef)
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

// GetCreateSQL generates CREATE TABLE SQL
func GetCreateSQL(td *domain.TableDefinition) string {
	var columns []string

	// Add columns
	for _, col := range td.Columns {
		columnSQL := buildColumnSQL(col)
		columns = append(columns, columnSQL)
	}

	// Add primary key constraint if not already defined in column
	pkColumns := getPrimaryKeyColumns(td.Columns)
	if len(pkColumns) > 1 {
		columns = append(columns, fmt.Sprintf("PRIMARY KEY (%s)",
			strings.Join(pkColumns, ", ")))
	}

	// Add foreign key constraints
	fkConstraints := getForeignKeyConstraints(td.Columns)
	columns = append(columns, fkConstraints...)

	return fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (\n    %s\n)",
		td.Name, strings.Join(columns, ",\n    "))
}

// buildColumnSQL builds SQL for a single column
func buildColumnSQL(col domain.Column) string {
	var parts []string

	// Column name and type
	parts = append(parts, col.Name, col.Type.MySQL)

	// Auto increment
	if col.AutoIncrement {
		parts = append(parts, "AUTO_INCREMENT")
	}

	// Not null constraint
	if col.NotNull {
		parts = append(parts, "NOT NULL")
	}

	// Default value
	if col.Default != "" {
		parts = append(parts, "DEFAULT", col.Default)
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
func GetIndexSQL(td *domain.TableDefinition) []string {
	var indexSQLs []string

	// 1. Process explicitly defined indexes from Indexes array
	for _, idx := range td.Indexes {
		var sql string
		indexName := fmt.Sprintf("idx_%s_%s", td.Name, idx.Name)

		if idx.Unique {
			sql = fmt.Sprintf("CREATE UNIQUE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, td.Name, strings.Join(idx.Columns, ", "))
		} else {
			sql = fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, td.Name, strings.Join(idx.Columns, ", "))
		}

		indexSQLs = append(indexSQLs, sql)
	}

	// 2. Process column-level Index and Unique attributes
	for _, col := range td.Columns {
		// Skip if column already has explicit index definition or is primary key
		if col.PrimaryKey || isColumnInExplicitIndexes(col.Name, td.Indexes) {
			continue
		}

		var sql string
		var indexName string

		if col.Unique {
			// Create unique index for column with Unique: true
			indexName = fmt.Sprintf("idx_%s_%s_unique", td.Name, col.Name)
			sql = fmt.Sprintf("CREATE UNIQUE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, td.Name, col.Name)
			indexSQLs = append(indexSQLs, sql)
		} else if col.Index {
			// Create regular index for column with Index: true
			indexName = fmt.Sprintf("idx_%s_%s", td.Name, col.Name)
			sql = fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, td.Name, col.Name)
			indexSQLs = append(indexSQLs, sql)
		}
	}

	return indexSQLs
}

// isColumnInExplicitIndexes checks if a column is already covered by explicitly defined indexes
func isColumnInExplicitIndexes(columnName string, indexes []domain.Index) bool {
	for _, idx := range indexes {
		for _, idxCol := range idx.Columns {
			if idxCol == columnName {
				return true
			}
		}
	}
	return false
}

// getForeignKeyConstraints returns list of foreign key constraint SQL strings
func getForeignKeyConstraints(columns []domain.Column) []string {
	var fkConstraints []string
	for _, col := range columns {
		if col.ForeignKey != nil {
			constraintSQL := fmt.Sprintf("FOREIGN KEY (%s) REFERENCES %s(%s)",
				col.Name, col.ForeignKey.Table, col.ForeignKey.Column)
			fkConstraints = append(fkConstraints, constraintSQL)
		}
	}
	return fkConstraints
}

// getExistingColumnNames returns a lowercase set of column names that already exist in the table.
// It reuses the same "SELECT ... WHERE 1=0" pattern as tableExists to avoid fetching actual data.
func getExistingColumnNames(db Database, tableName string) (map[string]bool, error) {
	// tableName comes from the in-code schema definitions, never user input, and
	// SQL identifiers cannot be bound as query parameters.
	// nosemgrep: go.lang.security.audit.database.string-formatted-query.string-formatted-query
	rows, err := db.Query(fmt.Sprintf("SELECT * FROM %s WHERE 1=0", tableName))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	existing := make(map[string]bool, len(cols))
	for _, col := range cols {
		existing[strings.ToLower(col)] = true
	}
	return existing, nil
}

// syncMissingColumns adds any columns present in tableDef that do not yet exist in the database table.
// It reuses buildColumnSQL to generate the column definition for each ALTER TABLE statement.
// Columns are inserted at the position defined in the schema (ADD COLUMN ... AFTER <col> / FIRST)
// by locating the nearest preceding column that already exists.
func syncMissingColumns(db Database, tableDef *domain.TableDefinition) error {
	existing, err := getExistingColumnNames(db, tableDef.Name)
	if err != nil {
		return fmt.Errorf("failed to get existing columns for table %s: %v", tableDef.Name, err)
	}

	existingNames := make([]string, 0, len(existing))
	for name := range existing {
		existingNames = append(existingNames, name)
	}

	definedNames := make([]string, 0, len(tableDef.Columns))
	for _, col := range tableDef.Columns {
		definedNames = append(definedNames, col.Name)
	}

	slog.Debug("Syncing columns for table", "table", tableDef.Name, "existing", existingNames, "defined", definedNames)

	for i, col := range tableDef.Columns {
		if existing[strings.ToLower(col.Name)] {
			continue
		}

		colDef := buildColumnSQL(col)
		positionSuffix := columnPositionSuffix(tableDef.Columns, i, existing)
		// Table and column definitions come from the in-code schema, never user
		// input, and DDL identifiers cannot be bound as query parameters.
		// nosemgrep: go.lang.security.audit.database.string-formatted-query.string-formatted-query
		alterSQL := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s%s", tableDef.Name, colDef, positionSuffix)

		if _, err := db.Exec(alterSQL); err != nil {
			return fmt.Errorf("failed to add column %s to table %s: %v", col.Name, tableDef.Name, err)
		}

		// Track the newly added column so that subsequent missing columns in this
		// same sync pass can use it as a valid AFTER anchor.
		existing[strings.ToLower(col.Name)] = true

		slog.Info("Column added to table", "table", tableDef.Name, "column", col.Name)
	}

	return nil
}

// columnPositionSuffix returns the MySQL-specific position clause for ADD COLUMN.
// It walks backwards from colIndex to find the nearest preceding column that already
// exists in the database, then returns " AFTER <name>". If no such column exists
// (i.e. the new column belongs at the very beginning), it returns " FIRST".
func columnPositionSuffix(columns []domain.Column, colIndex int, existing map[string]bool) string {
	for i := colIndex - 1; i >= 0; i-- {
		if existing[strings.ToLower(columns[i].Name)] {
			return fmt.Sprintf(" AFTER %s", columns[i].Name)
		}
	}
	return " FIRST"
}

// tableExists checks if a table exists in the database
func tableExists(db Database, tableName string) (bool, error) {
	// Try to execute a query that would fail if table doesn't exist. tableName
	// comes from the in-code schema definitions, never user input.
	// nosemgrep: go.lang.security.audit.database.string-formatted-query.string-formatted-query
	checkQuery := fmt.Sprintf("SELECT 1 FROM %s WHERE 1=0", tableName)
	_, err := db.Exec(checkQuery)

	if err != nil {
		// MySQL reports a missing table as "Table '...' doesn't exist"
		if strings.Contains(strings.ToLower(err.Error()), "doesn't exist") {
			return false, nil
		}
		// Other error, return it
		return false, err
	}

	// Query succeeded, table exists
	return true, nil
}
