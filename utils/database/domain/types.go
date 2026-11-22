package domain

import "fmt"

// ColumnType represents a database column data type
type ColumnType struct {
	MySQL string
}

// Common column types
var (
	IntType     = ColumnType{MySQL: "INT"}
	BigIntType  = ColumnType{MySQL: "BIGINT"}
	VarcharType = func(length int) ColumnType {
		return ColumnType{MySQL: fmt.Sprintf("VARCHAR(%d)", length)}
	}
	TextType      = ColumnType{MySQL: "TEXT"}
	TimestampType = ColumnType{MySQL: "TIMESTAMP"}
	DatetimeType  = ColumnType{MySQL: "DATETIME"}
	BooleanType   = ColumnType{MySQL: "TINYINT(1)"}
	DecimalType   = func(precision, scale int) ColumnType {
		return ColumnType{MySQL: fmt.Sprintf("DECIMAL(%d,%d)", precision, scale)}
	}
)

// ForeignKey represents a foreign key constraint
type ForeignKey struct {
	Table  string
	Column string
}

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
	ForeignKey    *ForeignKey
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
