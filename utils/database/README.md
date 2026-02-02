# Database Module

A unified database operation module that supports both MySQL and PostgreSQL, providing a simple and easy-to-use CRUD interface.

## Features

- 🔄 Support for MySQL and PostgreSQL
- 🚀 Unified CRUD operation interface using Squirrel query builder
- ⚙️ Environment variable configuration management
- 🔗 Automatic connection pool management
- 🛡️ Built-in error handling with custom DatabaseError type
- 📝 Clean API design with struct-to-map conversion
- 🏗️ Automatic table creation and initialization
- 📋 Centralized table schema definitions
- 🔒 Thread-safe table registry management
- 🎯 Mock-friendly design for testing
- 📄 Built-in pagination support with LIMIT and OFFSET

## Installation

Install the required dependencies:

```bash
go get github.com/go-sql-driver/mysql
go get github.com/lib/pq
go get github.com/Masterminds/squirrel
```

## Configuration

Set up database connection information in your project's `.env` file:

```env
# Database type (mysql or postgresql)
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=word_flashcard
```

### Default Parameters

The following parameters are predefined in the code and don't need to be set in `.env`:

- **SSL Mode**: `disable`
- **Max Open Connections**: `25`
- **Max Idle Connections**: `25`

## Architecture Overview

### Directory Structure

```
utils/database/
├── domain/                    # Table schema definitions
│   └── types.go              # Column types and table definition structures
├── config.go                 # Configuration management and environment loading
├── factory.go                # Database factory functions
├── database.go               # Core database interface and utility functions
├── connection.go             # UniversalDatabase implementation (MySQL/PostgreSQL)
├── table_registry.go         # Table registration and management system
├── table_creator.go          # SQL generation and table creation
└── README.md                 # This file
```

### Core Components

#### 1. Configuration System (`config.go`)
- `LoadConfig()`: Loads database configuration from environment variables
- Uses `config.GetOrDefault()` helper function for environment variable handling

#### 2. Database Factory (`factory.go`)
- `NewDatabase(config)`: Creates database instance with manual configuration
- `NewDatabaseFromEnv()`: Creates database instance from environment variables

#### 3. Core Database Interface (`database.go`)
- `Database`: Main interface defining CRUD operations
- `DatabaseError`: Custom error type with operation context
- `structToMap()`: Converts Go structs to database-compatible maps
- `scanToStruct()`: Scans SQL rows into Go struct slices
- String conversion utilities (`camelToSnake`, `snakeToCamel`)

#### 4. Universal Database Implementation (`connection.go`)
- `UniversalDatabase`: Unified implementation supporting both MySQL and PostgreSQL
- Automatic placeholder format handling (`?` for MySQL, `$1` for PostgreSQL)
- Database-specific SQL generation for INSERT operations

#### 5. Table Management System
- **Registry (`table_registry.go`)**: Thread-safe in-memory table definition storage
- **Creator (`table_creator.go`)**: SQL generation and table creation logic

#### 6. Domain Models (`domain/`)
- **types.go**: Column types and table structure definitions

## Table Schema Management

### Available Column Types

```go
// Predefined column types
IntType                        // INT / INTEGER
BigIntType                     // BIGINT / BIGINT
VarcharType(length)           // VARCHAR(length)
TextType                      // TEXT / TEXT
TimestampType                 // TIMESTAMP / TIMESTAMP
DatetimeType                  // DATETIME / TIMESTAMP
BooleanType                   // TINYINT(1) / BOOLEAN
DecimalType(precision, scale) // DECIMAL(p,s) / DECIMAL(p,s)
```

### Defining New Tables

Create a new file in the `domain/` directory:

```go
// utils/database/domain/users.go
package domain

func UsersTable() *TableDefinition {
    return &TableDefinition{
        Name: "users",
        Columns: []Column{
            {
                Name:          "id",
                Type:          IntType,
                NotNull:       true,
                AutoIncrement: true,
                PrimaryKey:    true,
            },
            {
                Name:    "username",
                Type:    VarcharType(50),
                NotNull: true,
                Unique:  true,
            },
            {
                Name:    "email",
                Type:    VarcharType(255),
                NotNull: true,
                Unique:  true,
            },
            {
                Name:    "created_at",
                Type:    TimestampType,
                NotNull: true,
                Default: "CURRENT_TIMESTAMP",
            },
        },
        Indexes: []Index{
            {
                Name:    "idx_username",
                Columns: []string{"username"},
                Unique:  true,
            },
        },
        Description: "User accounts table",
    }
}
```

Register the table using the individual `RegisterTable()` function:

```go
// Register your table definition
table := domain.UsersTable()
if err := database.RegisterTable(table); err != nil {
    log.Printf("Failed to register table %s: %v", table.Name, err)
}
```

## Quick Start

### 1. Initialize Database with Auto Table Creation

```go
package main

import (
    "log"
    "word-flashcard/utils/database"
)

func main() {
    // Register table schemas to memory (manual registration example)
    // You need to register your table definitions individually
    // table := domain.YourTableDefinition()
    // database.RegisterTable(table)

    // Create database instance from environment variables
    db, err := database.NewDatabaseFromEnv()
    if err != nil {
        log.Fatal("Failed to create database:", err)
    }

    // Establish connection
    if err := db.Connect(); err != nil {
        log.Fatal("Failed to connect:", err)
    }
    defer db.Close()

    // Create all registered tables
    if err := db.InitializeTables(); err != nil {
        log.Fatal("Failed to initialize tables:", err)
    }

    log.Println("Database initialized successfully!")
}
```

### 2. Manual Configuration

```go
config := &database.DBConfig{
    Type:         "mysql",
    Host:         "localhost",
    Port:         3306,
    User:         "root",
    Password:     "password",
    DatabaseName: "word_flashcard",
    // Other parameters use defaults: SSLMode, MaxOpenConns, MaxIdleConns
}

db, err := database.NewDatabase(config)
if err != nil {
    log.Fatal("Failed to create database:", err)
}
```

## CRUD Operations

### Insert Data

```go
// Using struct
type Word struct {
    Word       string `json:"word"`
    Definition string `json:"definition"`
}

word := Word{
    Word:       "hello",
    Definition: "A greeting or expression of goodwill",
}

id, err := db.Insert("words", word)
if err != nil {
    log.Printf("Insert failed: %v", err)
    return
}

log.Printf("Insert successful, ID: %d", id)

// Using map
data := map[string]interface{}{
    "word":       "world",
    "definition": "The earth and all its inhabitants",
}

id, err = db.Insert("words", data)
```

### Query Data

```go
import "github.com/Masterminds/squirrel"

type Word struct {
    ID         int    `db:"id"`
    Word       string `json:"word"`
    Definition string `json:"definition"`
}

// Query all records
var words []Word
err := db.Select("words", nil, nil, nil, nil, nil, &words)
if err != nil {
    log.Printf("Select failed: %v", err)
    return
}

// Query with WHERE condition using squirrel
where := squirrel.Eq{"word": "hello"}
var results []Word
err = db.Select("words", nil, where, nil, nil, nil, &results)

// Query with complex conditions
where = squirrel.And{
    squirrel.Like{"word": "hel%"},
    squirrel.Gt{"id": 10},
}
err = db.Select("words", nil, where, nil, nil, nil, &results)

// Query with pagination (LIMIT and OFFSET)
limit := uint64(10)    // Limit to 10 records
offset := uint64(20)   // Skip first 20 records
orderBy := []*string{stringPtr("id ASC")}
err = db.Select("words", nil, nil, orderBy, &limit, &offset, &results)
if err != nil {
    log.Printf("Select with pagination failed: %v", err)
    return
}

// Query with only LIMIT (first page)
limit = uint64(5)
err = db.Select("words", nil, nil, orderBy, &limit, nil, &results)

// Query with only OFFSET (skip records)
offset = uint64(10)
err = db.Select("words", nil, nil, orderBy, nil, &offset, &results)

// Helper function to create string pointer
func stringPtr(s string) *string {
    return &s
}
```

### Pagination Support

The `Select` method supports pagination through `limit` and `offset` parameters:

```go
// Method signature
Select(table string, columns []*string, where squirrel.Sqlizer, orderBy []*string, limit *uint64, offset *uint64, dest interface{}) error
```

#### Parameters:
- **limit**: Pointer to `uint64` - Maximum number of records to return (use `nil` for no limit)
- **offset**: Pointer to `uint64` - Number of records to skip (use `nil` for no offset)

#### Pagination Examples:

```go
// Page 1: Get first 10 records
limit := uint64(10)
err := db.Select("words", nil, nil, orderBy, &limit, nil, &results)

// Page 2: Get records 11-20 (skip first 10, take next 10)
limit = uint64(10)
offset := uint64(10)
err = db.Select("words", nil, nil, orderBy, &limit, &offset, &results)

// Page 3: Get records 21-30
offset = uint64(20)
err = db.Select("words", nil, nil, orderBy, &limit, &offset, &results)

// Get all records after the 100th
offset = uint64(100)
err = db.Select("words", nil, nil, orderBy, nil, &offset, &results)

// Get only the first 5 records
limit = uint64(5)
err = db.Select("words", nil, nil, orderBy, &limit, nil, &results)
```

#### Best Practices:
1. Always use `ORDER BY` with pagination to ensure consistent results
2. Use appropriate page sizes (typically 10-100 records per page)
3. Consider database performance with large offsets
4. Both MySQL and PostgreSQL are fully supported

### Update Data

```go
// Update using struct
updateData := Word{
    Definition: "An updated definition",
}

where := squirrel.Eq{"id": 1}
rowsAffected, err := db.Update("words", updateData, where)
if err != nil {
    log.Printf("Update failed: %v", err)
    return
}

log.Printf("Updated %d rows", rowsAffected)

// Update using map
updateMap := map[string]interface{}{
    "definition": "Another updated definition",
}
rowsAffected, err = db.Update("words", updateMap, where)
```

### Delete Data

```go
// Delete specific record
where := squirrel.Eq{"id": 1}
rowsAffected, err := db.Delete("words", where)
if err != nil {
    log.Printf("Delete failed: %v", err)
    return
}

log.Printf("Deleted %d rows", rowsAffected)

// Delete multiple records
where = squirrel.Lt{"id": 100}
rowsAffected, err = db.Delete("words", where)
```

### Execute Raw SQL

```go
// Create custom table
createSQL := `
CREATE TABLE IF NOT EXISTS custom (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
)`

result, err := db.Exec(createSQL)
if err != nil {
    log.Printf("Exec failed: %v", err)
    return
}

log.Println("Custom SQL executed successfully")
```

## Error Handling

The module provides detailed error information through `DatabaseError`:

```go
id, err := db.Insert("words", data)
if err != nil {
    if dbErr, ok := err.(*database.DatabaseError); ok {
        log.Printf("Database %s operation failed: %v", dbErr.Operation, dbErr.Err)
    } else {
        log.Printf("Unknown error: %v", err)
    }
    return
}
```

## Table Registry Management

### Registry Functions

```go
// Register a table definition
err := database.RegisterTable(tableDefinition)

// Get a specific table
table, exists := database.GetTable("words")

// Get all registered tables
tables := database.GetAllTables()

// List table names
names := database.ListTableNames()

// Check if table exists
exists := database.TableExists("words")

// Clear registry (mainly for testing)
database.ClearRegistry()
```

## Database Type Differences

### MySQL vs PostgreSQL

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| Placeholder | `?` | `$1, $2, $3...` |
| Auto Increment | `AUTO_INCREMENT` | `SERIAL` |
| Insert Return | `LastInsertId()` | `RETURNING id` |
| Boolean Type | `TINYINT(1)` | `BOOLEAN` |
| Timestamp Update | `ON UPDATE CURRENT_TIMESTAMP` | Not supported |

### Automatic Handling

The `UniversalDatabase` automatically handles these differences:

- Placeholder format conversion
- INSERT statement generation
- Data type mapping
- SQL dialect differences

## Best Practices

### 1. Connection Management

```go
// Singleton pattern for database connection
var dbInstance database.Database
var dbOnce sync.Once

func GetDB() database.Database {
    dbOnce.Do(func() {
        // Register your table definitions individually here
        // table := domain.YourTableDefinition()
        // database.RegisterTable(table)

        db, err := database.NewDatabaseFromEnv()
        if err != nil {
            log.Fatal(err)
        }

        if err := db.Connect(); err != nil {
            log.Fatal(err)
        }

        if err := db.InitializeTables(); err != nil {
            log.Fatal(err)
        }

        dbInstance = db
    })
    return dbInstance
}
```

### 2. Struct Design for Database Operations

```go
type User struct {
    ID        int       `db:"id"`           // Maps to 'id' column
    Name      string    `json:"name"`       // Maps to 'name' column (camelCase -> snake_case)
    Email     string    `db:"email_addr"`   // Maps to 'email_addr' column
    CreatedAt time.Time `db:"created_at"`   // Auto-excluded from INSERT/UPDATE
    UpdatedAt time.Time `db:"updated_at"`   // Auto-excluded from INSERT/UPDATE
}
```

### 3. Error Handling Pattern

```go
func createUser(db database.Database, user User) error {
    id, err := db.Insert("users", user)
    if err != nil {
        if dbErr, ok := err.(*database.DatabaseError); ok {
            return fmt.Errorf("failed to create user (%s): %w", dbErr.Operation, dbErr.Err)
        }
        return fmt.Errorf("unexpected error: %w", err)
    }

    log.Printf("User created with ID: %d", id)
    return nil
}
```

## Testing Support

The module is designed to work seamlessly with mocking for unit tests:

```go
// Example test using sqlmock
func TestUserOperations(t *testing.T) {
    mockDB, mock, err := sqlmock.New()
    if err != nil {
        t.Fatalf("Failed to create mock: %v", err)
    }
    defer mockDB.Close()

    // Setup expectations
    mock.ExpectExec("INSERT INTO users").
        WillReturnResult(sqlmock.NewResult(1, 1))

    // Test your code...
}
```

## Important Notes

1. **Field Exclusion**: Fields named `id`, `created_at`, `updated_at` are automatically excluded from INSERT/UPDATE operations
2. **Thread Safety**: The table registry uses `sync.RWMutex` for concurrent access
3. **Connection Pool**: Default connection pool settings are optimized for typical applications
4. **SQL Injection Protection**: Always use the provided CRUD methods or parameterized queries

## Example: Complete Word Management

```go
package main

import (
    "log"
    "word-flashcard/utils/database"
    "github.com/Masterminds/squirrel"
)

type Word struct {
    ID         int    `db:"id"`
    Word       string `json:"word"`
    Definition string `json:"definition"`
}

func main() {
    // Initialize database
    // Register your table definitions individually
    // table := domain.YourTableDefinition()
    // database.RegisterTable(table)

    db, _ := database.NewDatabaseFromEnv()
    db.Connect()
    defer db.Close()
    db.InitializeTables()

    // Create
    word := Word{Word: "hello", Definition: "A greeting"}
    id, _ := db.Insert("words", word)

    // Read
    var words []Word
    db.Select("words", nil, squirrel.Eq{"id": id}, nil, nil, nil, &words)

    // Update
    db.Update("words", map[string]interface{}{"definition": "Updated definition"},
              squirrel.Eq{"id": id})

    // Delete
    db.Delete("words", squirrel.Eq{"id": id})
}