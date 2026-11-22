package database

import (
	"fmt"
)

// NewDatabase creates a new database instance based on configuration
func NewDatabase(config *DBConfig) (Database, error) {
	if config == nil {
		return nil, fmt.Errorf("database config is required")
	}

	return NewUniversalDatabase(config), nil
}

// NewDatabaseFromEnv creates a new database instance from environment variables
func NewDatabaseFromEnv() (Database, error) {
	config, err := LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %v", err)
	}

	return NewDatabase(config)
}
