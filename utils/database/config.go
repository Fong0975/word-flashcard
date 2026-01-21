package database

import (
	"fmt"
	"strconv"
	"word-flashcard/utils/config"
)

// DBConfig holds database configuration
type DBConfig struct {
	Type         string // mysql, postgresql
	Host         string
	Port         int
	User         string
	Password     string
	DatabaseName string
	SSLMode      string // Fixed to "disable"
	TablePrefix  string // Fixed to "wfc_"
	MaxOpenConns int    // Fixed to 25
	MaxIdleConns int    // Fixed to 25
}

// LoadConfig loads database configuration from environment variables
func LoadConfig() (*DBConfig, error) {
	dbConfig := &DBConfig{
		// Fixed values
		SSLMode:      "disable",
		TablePrefix:  "wfc_",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	// Load from environment variables
	dbConfig.Type = config.GetOrDefault("DB_TYPE", "mysql")
	dbConfig.Host = config.GetOrDefault("DB_HOST", "localhost")
	dbConfig.User = config.GetOrDefault("DB_USER", "root")
	dbConfig.Password = config.GetOrDefault("DB_PASSWORD", "")
	dbConfig.DatabaseName = config.GetOrDefault("DB_NAME", "word_flashcard")

	// Parse port
	portStr := config.GetOrDefault("DB_PORT", "3306")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}
	dbConfig.Port = port

	// Validate required fields
	if dbConfig.Type == "" {
		return nil, fmt.Errorf("DB_TYPE is required")
	}
	if dbConfig.Host == "" {
		return nil, fmt.Errorf("DB_HOST is required")
	}
	if dbConfig.User == "" {
		return nil, fmt.Errorf("DB_USER is required")
	}
	if dbConfig.DatabaseName == "" {
		return nil, fmt.Errorf("DB_NAME is required")
	}

	// Validate database type
	if dbConfig.Type != "mysql" && dbConfig.Type != "postgresql" {
		return nil, fmt.Errorf("unsupported database type: %s", dbConfig.Type)
	}

	return dbConfig, nil
}
