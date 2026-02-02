package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

// UniversalDatabase implements the Database interface for both MySQL and PostgreSQL
type UniversalDatabase struct {
	*BaseDatabase
}

// ================================= Connection Management =================================

// NewUniversalDatabase creates a new database instance that works with both MySQL and PostgreSQL
func NewUniversalDatabase(config *DBConfig) *UniversalDatabase {
	var placeholderFormat squirrel.PlaceholderFormat
	switch config.Type {
	case "mysql":
		placeholderFormat = squirrel.Question
	case "postgresql":
		placeholderFormat = squirrel.Dollar
	default:
		placeholderFormat = squirrel.Question // Default to MySQL format
	}

	base := NewBaseDatabase(config, placeholderFormat)
	return &UniversalDatabase{
		BaseDatabase: base,
	}
}

// Connect establishes a connection to the database
func (u *UniversalDatabase) Connect() error {
	var dsn string
	var driverName string

	switch u.config.Type {
	case "mysql":
		dsn = u.buildMySQLDSN()
		driverName = "mysql"
	case "postgresql":
		dsn = u.buildPostgreSQLDSN()
		driverName = "postgres"
	default:
		return NewDatabaseError("connect", fmt.Errorf("unsupported database type: %s", u.config.Type))
	}

	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return NewDatabaseError("connect", err)
	}

	if err := db.Ping(); err != nil {
		return NewDatabaseError("ping", err)
	}

	u.configureConnection(db)
	u.db = db
	return nil
}

// Close closes the database connection
func (u *UniversalDatabase) Close() error {
	if u.db == nil {
		return nil
	}

	if err := u.db.Close(); err != nil {
		return NewDatabaseError("close", err)
	}

	u.db = nil
	return nil
}

// ================================= CRUD Operations =================================

// Select retrieves records from the database and populates the dest slice
func (u *UniversalDatabase) Select(table string, columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64, dest interface{}) error {
	if u.db == nil {
		slog.Error("Database is not connected")
		return NewDatabaseError("select", fmt.Errorf("not connected"))
	}

	// --------------- 1. Prepare Select Parameters ---------------
	sqlColumn := "*"
	if len(columns) > 0 {
		var colNames []string
		for _, col := range columns {
			colNames = append(colNames, *col)
		}
		sqlColumn = strings.Join(colNames, ", ")
	}

	// --------------- 2. Build Query Object ---------------
	query := squirrel.Select(sqlColumn).
		From(table).
		PlaceholderFormat(u.placeholderFormat)

	// Where
	if where != nil {
		query = query.Where(where)
	}
	// OrderBy
	if len(orderBy) > 0 {
		var orderCols []string
		for _, col := range orderBy {
			orderCols = append(orderCols, *col)
		}
		query = query.OrderBy(orderCols...)
	}
	// Limit
	if limit != nil {
		query = query.Limit(*limit)
	}
	// Offset
	if offset != nil {
		query = query.Offset(*offset)
	}

	// --------------- 3. Convert to SQL ---------------
	sql, args, err := query.ToSql()
	if err != nil {
		slog.Error("Select had been done but failed to build SELECT query", "error", err)
		return NewDatabaseError("select", err)
	}

	// --------------- 4. Run the SQL ---------------
	u.logQuery(sql, args)
	rows, err := u.db.Query(sql, args...)
	if err != nil {
		slog.Error("Select had been done but failed to execute query", "error", err)
		return NewDatabaseError("select", err)
	}
	defer rows.Close()

	// --------------- 5. Convert Result & Return ---------------
	return scanToStruct(rows, dest)
}

// Insert adds a new record to the database and returns the inserted ID
func (u *UniversalDatabase) Insert(table string, data interface{}) (int64, error) {
	if u.db == nil {
		slog.Error("Database is not connected")
		return 0, NewDatabaseError("insert", fmt.Errorf("not connected"))
	}

	// --------------- 1. Parse Insert Data ---------------
	dataMap, err := structToMap(data)
	if err != nil {
		slog.Error("Insert had been done but failed to convert to map", "error", err)
		return 0, NewDatabaseError("insert", err)
	}
	// Empty check
	if len(dataMap) == 0 {
		slog.Error("Insert had been done but no data to insert", "data", data)
		return 0, NewDatabaseError("insert", fmt.Errorf("no data to insert"))
	}

	// --------------- 2. Prepare Insert Parameters ---------------
	columns := make([]string, 0, len(dataMap))
	values := make([]interface{}, 0, len(dataMap))
	for column, value := range dataMap {
		columns = append(columns, column)
		values = append(values, value)
	}

	// --------------- 3. Build Query Object ---------------
	query := squirrel.Insert(table).
		Columns(columns...).
		Values(values...).
		PlaceholderFormat(u.placeholderFormat)

	// --------------- 4. Convert to SQL ---------------
	sql, args, err := query.ToSql()
	if err != nil {
		slog.Error("Insert had been done but failed to build INSERT ID query", "error", err)
		return 0, NewDatabaseError("insert", err)
	}

	// -------------- 5. Run the SQL ---------------
	u.logQuery(sql, args)
	_, err = u.db.Exec(sql, args...)
	if err != nil {
		slog.Error("Insert had been done but failed to insert ID query", "error", err)
		return 0, NewDatabaseError("insert", err)
	}

	// --------------- 6. Query Inserted ID ---------------
	// Convert insert parameters as Where
	querySelect := squirrel.Select("id").
		From(table).
		PlaceholderFormat(u.placeholderFormat)

	// Add insert parameters as Where
	for column, value := range dataMap {
		querySelect = querySelect.Where(squirrel.Eq{column: value})
	}

	// Convert to SQL
	sqlSelect, argsSelect, err := querySelect.ToSql()
	if err != nil {
		slog.Warn("Insert had been done but failed to build INSERT ID query", "error", err)
		return 0, nil
	}

	// Run the SQL
	u.logQuery(sql, args)
	row := u.db.QueryRow(sqlSelect, argsSelect...)

	// Scan the result
	var insertedID int64
	err = row.Scan(&insertedID)
	if err != nil {
		slog.Warn("Insert had been done but failed to scan INSERT ID", "error", err)
		return 0, nil
	}

	// --------------- 6. Return Result ---------------
	return insertedID, nil
}

// Update modifies existing records in the database and returns the number of affected rows
func (u *UniversalDatabase) Update(table string, data interface{}, where squirrel.Sqlizer) (int64, error) {
	if u.db == nil {
		slog.Error("Database is not connected")
		return 0, NewDatabaseError("update", fmt.Errorf("not connected"))
	}

	// --------------- 1. Parse Update Data ---------------
	dataMap, err := structToMap(data)
	if err != nil {
		slog.Error("Update had been done but failed to convert to map", "error", err)
		return 0, NewDatabaseError("update", err)
	}
	// Empty check
	if len(dataMap) == 0 {
		slog.Error("Update had been done but no data to update", "data", data)
		return 0, NewDatabaseError("update", fmt.Errorf("no data to update"))
	}
	// Add UpdatedAt timestamp if applicable
	dataMap["updated_at"] = time.Now()

	// --------------- 2. Build Query Object ---------------
	query := squirrel.Update(table).
		SetMap(dataMap).
		PlaceholderFormat(u.placeholderFormat)
	// Where
	if where != nil {
		query = query.Where(where)
	} else {
		// now allow full table updates
		slog.Error("Update had been done but failed to build UPDATE ID query")
		return 0, NewDatabaseError("update", fmt.Errorf("update operation requires a WHERE clause"))
	}

	// --------------- 3. Convert to SQL ---------------
	sql, args, err := query.ToSql()
	if err != nil {
		slog.Error("Update had been done but failed to build UPDATE ID query", "error", err)
		return 0, NewDatabaseError("update", err)
	}

	// --------------- 4. Run the SQL ---------------
	u.logQuery(sql, args)
	result, err := u.db.Exec(sql, args...)
	if err != nil {
		slog.Error("Update had been done but failed to update ID query", "error", err)
		return 0, NewDatabaseError("update", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Update had been done but failed to get affected rows", "error", err)
		return 0, NewDatabaseError("update", err)
	} else if rowsAffected == 0 {
		slog.Warn("Update executed but no rows were affected")
		return 0, NewDatabaseError("update", fmt.Errorf("no rows were affected"))
	}

	// --------------- 5. Return Result ---------------
	return rowsAffected, nil
}

func (u *UniversalDatabase) Delete(table string, where squirrel.Sqlizer) (int64, error) {
	if u.db == nil {
		slog.Error("Database is not connected")
		return 0, NewDatabaseError("delete", fmt.Errorf("not connected"))
	}

	// --------------- 1. Build Query Object ---------------
	query := squirrel.Delete(table).
		PlaceholderFormat(u.placeholderFormat)
	// Where
	if where != nil {
		query = query.Where(where)
	} else {
		// now allow full table deletes
		slog.Error("Delete had been done but failed to build DELETE ID query")
		return 0, NewDatabaseError("delete", fmt.Errorf("delete operation requires a WHERE clause"))
	}

	// --------------- 2. Convert to SQL ---------------
	sql, args, err := query.ToSql()
	if err != nil {
		slog.Error("Delete had been done but failed to build DELETE ID query", "error", err)
		return 0, NewDatabaseError("delete", err)
	}

	// --------------- 3. Run the SQL ---------------
	u.logQuery(sql, args)
	result, err := u.db.Exec(sql, args...)
	if err != nil {
		slog.Error("Delete had been done but failed to delete ID query", "error", err)
		return 0, NewDatabaseError("delete", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Delete had been done but failed to get affected rows", "error", err)
		return 0, NewDatabaseError("delete", err)
	} else if rowsAffected == 0 {
		slog.Warn("Delete executed but no rows were affected")
		return 0, NewDatabaseError("delete", fmt.Errorf("no rows were affected"))
	}

	// --------------- 4. Return Result ---------------
	return rowsAffected, nil
}

// ================================= Low-level Operations =================================

// Exec executes a raw SQL query (for table creation and migrations)
func (u *UniversalDatabase) Exec(query string, args ...interface{}) (sql.Result, error) {
	if u.db == nil {
		return nil, NewDatabaseError("exec", fmt.Errorf("not connected"))
	}

	result, err := u.db.Exec(query, args...)
	if err != nil {
		return nil, NewDatabaseError("exec", err)
	}

	return result, nil
}

// InitializeTables creates all registered tables
func (u *UniversalDatabase) InitializeTables() error {
	if u.db == nil {
		return NewDatabaseError("initialize_tables", fmt.Errorf("not connected"))
	}

	return CreateDatabaseTables(u, u.config.Type)
}

// buildMySQLDSN builds MySQL data source name
func (u *UniversalDatabase) buildMySQLDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true",
		u.config.User, u.config.Password,
		u.config.Host, u.config.Port,
		u.config.DatabaseName)
}

// buildPostgreSQLDSN builds PostgreSQL data source name
func (u *UniversalDatabase) buildPostgreSQLDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		u.config.Host, u.config.Port, u.config.User, u.config.Password,
		u.config.DatabaseName, u.config.SSLMode)
}

// GetDB returns the underlying sql.DB connection
// This method provides access to the raw database connection for advanced operations
func (u *UniversalDatabase) GetDB() *sql.DB {
	return u.db
}

// configureConnection configures database connection parameters
func (u *UniversalDatabase) configureConnection(db *sql.DB) {
	db.SetMaxOpenConns(u.config.MaxOpenConns)
	db.SetMaxIdleConns(u.config.MaxIdleConns)
}

func (u *UniversalDatabase) logQuery(sql string, args []interface{}) {
	var query string

	jsonArgs, err := json.Marshal(args)
	if err != nil {
		slog.Warn("Error marshalling query args to JSON", "error", err)
		query = ""
	} else {
		query = string(jsonArgs)
	}

	slog.Debug("Executing query", "sql", sql, "args", query)
}
