package database

import (
	"fmt"
)

// NewDatabase creates a new database instance based on configuration
func NewDatabase(config *Config) (Database, error) {
	if config == nil {
		return nil, fmt.Errorf("database config is required")
	}

	// Validate database type
	if config.Type != "mysql" && config.Type != "postgresql" {
		return nil, fmt.Errorf("unsupported database type: %s", config.Type)
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
