package database

import (
	"database/sql"
	"fmt"

	"github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

// UniversalDatabase implements the Database interface for both MySQL and PostgreSQL
type UniversalDatabase struct {
	*BaseDatabase
}

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

// Select retrieves records from the database and populates the dest slice
func (u *UniversalDatabase) Select(table string, where squirrel.Sqlizer, dest interface{}) error {
	if u.db == nil {
		return NewDatabaseError("select", fmt.Errorf("not connected"))
	}

	query := squirrel.Select("*").
		From(u.getTableName(table)).
		PlaceholderFormat(u.placeholderFormat)

	if where != nil {
		query = query.Where(where)
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return NewDatabaseError("select", err)
	}

	rows, err := u.db.Query(sql, args...)
	if err != nil {
		return NewDatabaseError("select", err)
	}
	defer rows.Close()

	return scanToStruct(rows, dest)
}

// Insert inserts a record into the database
func (u *UniversalDatabase) Insert(table string, data interface{}) (int64, error) {
	if u.db == nil {
		return 0, NewDatabaseError("insert", fmt.Errorf("not connected"))
	}

	dataMap, err := structToMap(data)
	if err != nil {
		return 0, NewDatabaseError("insert", err)
	}

	if len(dataMap) == 0 {
		return 0, NewDatabaseError("insert", fmt.Errorf("no data to insert"))
	}

	// Collect columns and values separately
	columns := make([]string, 0, len(dataMap))
	values := make([]interface{}, 0, len(dataMap))

	for column, value := range dataMap {
		columns = append(columns, column)
		values = append(values, value)
	}

	query := squirrel.Insert(u.getTableName(table)).
		PlaceholderFormat(u.placeholderFormat).
		Columns(columns...).
		Values(values...)

	switch u.config.Type {
	case "mysql":
		sql, args, err := query.ToSql()
		if err != nil {
			return 0, NewDatabaseError("insert", err)
		}

		result, err := u.db.Exec(sql, args...)
		if err != nil {
			return 0, NewDatabaseError("insert", err)
		}

		return result.LastInsertId()

	case "postgresql":
		query = query.Suffix("RETURNING id")
		sql, args, err := query.ToSql()
		if err != nil {
			return 0, NewDatabaseError("insert", err)
		}

		var id int64
		err = u.db.QueryRow(sql, args...).Scan(&id)
		if err != nil {
			return 0, NewDatabaseError("insert", err)
		}

		return id, nil

	default:
		return 0, NewDatabaseError("insert", fmt.Errorf("unsupported database type: %s", u.config.Type))
	}
}

// Update updates records in the database
func (u *UniversalDatabase) Update(table string, data interface{}, where squirrel.Sqlizer) (int64, error) {
	if u.db == nil {
		return 0, NewDatabaseError("update", fmt.Errorf("not connected"))
	}

	dataMap, err := structToMap(data)
	if err != nil {
		return 0, NewDatabaseError("update", err)
	}

	if len(dataMap) == 0 {
		return 0, NewDatabaseError("update", fmt.Errorf("no data to update"))
	}

	query := squirrel.Update(u.getTableName(table)).
		PlaceholderFormat(u.placeholderFormat)

	for column, value := range dataMap {
		query = query.Set(column, value)
	}

	if where != nil {
		query = query.Where(where)
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return 0, NewDatabaseError("update", err)
	}

	result, err := u.db.Exec(sql, args...)
	if err != nil {
		return 0, NewDatabaseError("update", err)
	}

	return result.RowsAffected()
}

// Delete removes records from the database
func (u *UniversalDatabase) Delete(table string, where squirrel.Sqlizer) (int64, error) {
	if u.db == nil {
		return 0, NewDatabaseError("delete", fmt.Errorf("not connected"))
	}

	query := squirrel.Delete(u.getTableName(table)).
		PlaceholderFormat(u.placeholderFormat)

	if where != nil {
		query = query.Where(where)
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return 0, NewDatabaseError("delete", err)
	}

	result, err := u.db.Exec(sql, args...)
	if err != nil {
		return 0, NewDatabaseError("delete", err)
	}

	return result.RowsAffected()
}

// Count counts records in the database
func (u *UniversalDatabase) Count(table string, where squirrel.Sqlizer) (int64, error) {
	if u.db == nil {
		return 0, NewDatabaseError("count", fmt.Errorf("not connected"))
	}

	query := squirrel.Select("COUNT(*)").
		From(u.getTableName(table)).
		PlaceholderFormat(u.placeholderFormat)

	if where != nil {
		query = query.Where(where)
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return 0, NewDatabaseError("count", err)
	}

	var count int64
	err = u.db.QueryRow(sql, args...).Scan(&count)
	if err != nil {
		return 0, NewDatabaseError("count", err)
	}

	return count, nil
}

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

	return CreateDatabaseTables(u, u.config.Type, u.config.TablePrefix)
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

// configureConnection configures database connection parameters
func (u *UniversalDatabase) configureConnection(db *sql.DB) {
	db.SetMaxOpenConns(u.config.MaxOpenConns)
	db.SetMaxIdleConns(u.config.MaxIdleConns)
}
