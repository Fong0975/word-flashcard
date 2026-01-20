package database

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"

	"github.com/Masterminds/squirrel"
)

// Database defines the common interface for database operations
type Database interface {
	// Connection management
	Connect() error
	Close() error

	// CRUD operations
	Select(table string, where squirrel.Sqlizer, dest interface{}) error
	Insert(table string, data interface{}) (int64, error)
	Update(table string, data interface{}, where squirrel.Sqlizer) (int64, error)
	Delete(table string, where squirrel.Sqlizer) (int64, error)
	Count(table string, where squirrel.Sqlizer) (int64, error)

	// Low-level operations (for table creation and migrations)
	Exec(query string, args ...interface{}) (sql.Result, error)
	InitializeTables() error
}

// DatabaseError represents a database operation error
type DatabaseError struct {
	Operation string
	Err       error
}

func (e *DatabaseError) Error() string {
	return fmt.Sprintf("database %s error: %v", e.Operation, e.Err)
}

// NewDatabaseError creates a new database error
func NewDatabaseError(operation string, err error) *DatabaseError {
	return &DatabaseError{
		Operation: operation,
		Err:       err,
	}
}

// BaseDatabase provides common functionality for both MySQL and PostgreSQL
type BaseDatabase struct {
	config            *Config
	db                *sql.DB
	placeholderFormat squirrel.PlaceholderFormat
}

// NewBaseDatabase creates a new base database instance
func NewBaseDatabase(config *Config, placeholderFormat squirrel.PlaceholderFormat) *BaseDatabase {
	return &BaseDatabase{
		config:            config,
		placeholderFormat: placeholderFormat,
	}
}

// getTableName returns the full table name with prefix
func (b *BaseDatabase) getTableName(table string) string {
	return b.config.TablePrefix + table
}

// structToMap converts a struct to map[string]interface{} using reflection
func structToMap(data interface{}) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	if data == nil {
		return result, nil
	}

	// Handle map directly
	if m, ok := data.(map[string]interface{}); ok {
		return m, nil
	}

	value := reflect.ValueOf(data)
	if value.Kind() == reflect.Ptr {
		value = value.Elem()
	}

	if value.Kind() != reflect.Struct {
		return nil, fmt.Errorf("data must be a struct or pointer to struct")
	}

	valueType := value.Type()
	for i := 0; i < value.NumField(); i++ {
		field := valueType.Field(i)
		fieldValue := value.Field(i)

		// Skip unexported fields
		if !field.IsExported() {
			continue
		}

		// Get field name from db tag, json tag, or field name
		var fieldName string
		if dbTag := field.Tag.Get("db"); dbTag != "" && dbTag != "-" {
			fieldName = strings.Split(dbTag, ",")[0]
		} else if jsonTag := field.Tag.Get("json"); jsonTag != "" && jsonTag != "-" {
			fieldName = strings.Split(jsonTag, ",")[0]
		} else {
			// Convert CamelCase to snake_case
			fieldName = camelToSnake(field.Name)
		}

		// Skip auto-generated fields (usually managed by database)
		lowerFieldName := strings.ToLower(fieldName)
		if lowerFieldName == "id" || lowerFieldName == "created_at" || lowerFieldName == "updated_at" {
			continue
		}

		if fieldValue.IsValid() && !fieldValue.IsZero() {
			result[fieldName] = fieldValue.Interface()
		}
	}

	return result, nil
}

// camelToSnake converts CamelCase to snake_case
func camelToSnake(str string) string {
	var result strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteByte('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}

// scanToStruct scans database rows into a struct slice
func scanToStruct(rows *sql.Rows, dest interface{}) error {
	destValue := reflect.ValueOf(dest)
	if destValue.Kind() != reflect.Ptr {
		return fmt.Errorf("dest must be a pointer")
	}

	destValue = destValue.Elem()
	if destValue.Kind() != reflect.Slice {
		return fmt.Errorf("dest must be a pointer to slice")
	}

	elementType := destValue.Type().Elem()
	if elementType.Kind() == reflect.Ptr {
		elementType = elementType.Elem()
	}

	columns, err := rows.Columns()
	if err != nil {
		return err
	}

	for rows.Next() {
		// Create new instance of element type
		elem := reflect.New(elementType).Elem()

		// Create scan destinations
		scanDests := make([]interface{}, len(columns))
		for i, column := range columns {
			fieldName := snakeToCamel(column)
			field := elem.FieldByName(fieldName)
			if field.IsValid() && field.CanSet() {
				scanDests[i] = field.Addr().Interface()
			} else {
				var dummy interface{}
				scanDests[i] = &dummy
			}
		}

		// Scan the row
		if err := rows.Scan(scanDests...); err != nil {
			return err
		}

		// Append to slice
		if destValue.Type().Elem().Kind() == reflect.Ptr {
			destValue.Set(reflect.Append(destValue, elem.Addr()))
		} else {
			destValue.Set(reflect.Append(destValue, elem))
		}
	}

	return rows.Err()
}

// snakeToCamel converts snake_case to CamelCase
func snakeToCamel(str string) string {
	words := strings.Split(str, "_")
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(word[:1]) + strings.ToLower(word[1:])
		}
	}
	return strings.Join(words, "")
}
