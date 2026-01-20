package domain

import "fmt"

// ColumnType represents database column data types
type ColumnType struct {
	MySQL      string
	PostgreSQL string
}

// Common column types for both databases
var (
	IntType     = ColumnType{MySQL: "INT", PostgreSQL: "INTEGER"}
	BigIntType  = ColumnType{MySQL: "BIGINT", PostgreSQL: "BIGINT"}
	VarcharType = func(length int) ColumnType {
		return ColumnType{
			MySQL:      fmt.Sprintf("VARCHAR(%d)", length),
			PostgreSQL: fmt.Sprintf("VARCHAR(%d)", length),
		}
	}
	TextType      = ColumnType{MySQL: "TEXT", PostgreSQL: "TEXT"}
	TimestampType = ColumnType{MySQL: "TIMESTAMP", PostgreSQL: "TIMESTAMP"}
	DatetimeType  = ColumnType{MySQL: "DATETIME", PostgreSQL: "TIMESTAMP"}
	BooleanType   = ColumnType{MySQL: "TINYINT(1)", PostgreSQL: "BOOLEAN"}
	DecimalType   = func(precision, scale int) ColumnType {
		return ColumnType{
			MySQL:      fmt.Sprintf("DECIMAL(%d,%d)", precision, scale),
			PostgreSQL: fmt.Sprintf("DECIMAL(%d,%d)", precision, scale),
		}
	}
)

// Column represents a database column
type Column struct {
	Name          string
	Type          ColumnType
	NotNull       bool
	Default       string
	AutoIncrement bool
	PrimaryKey    bool
	Unique        bool
	Index         bool
}

// TableDefinition represents a complete table structure
type TableDefinition struct {
	Name        string
	Columns     []Column
	Indexes     []Index
	Description string
}

// Index represents a database index
type Index struct {
	Name    string
	Columns []string
	Unique  bool
}
