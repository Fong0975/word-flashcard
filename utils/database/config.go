package database

import (
	"fmt"
	"strconv"
	"word-flashcard/utils/config"
)

// DBConfig holds MySQL database configuration
type DBConfig struct {
	Host         string
	Port         int
	User         string
	Password     string
	DatabaseName string
	MaxOpenConns int // Fixed to 25
	MaxIdleConns int // Fixed to 25
}

// LoadConfig loads database configuration from environment variables
func LoadConfig() (*DBConfig, error) {
	dbConfig := &DBConfig{
		// Fixed values
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	// Load from environment variables
	dbConfig.Host = config.GetOrDefault("DB_HOST", "localhost")
	dbConfig.User = config.GetOrDefault("DB_USER", "root")
	dbConfig.DatabaseName = config.GetOrDefault("DB_NAME", "word_flashcard")

	// Parse port
	portStr := config.GetOrDefault("DB_PORT", "3306")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}
	dbConfig.Port = port

	password, err := config.GetSecretOrDefault("DB_PASSWORD", "")
	if err != nil {
		return nil, err
	}
	dbConfig.Password = password

	// Validate required fields
	if dbConfig.Host == "" {
		return nil, fmt.Errorf("DB_HOST is required")
	}
	if dbConfig.User == "" {
		return nil, fmt.Errorf("DB_USER is required")
	}
	if dbConfig.DatabaseName == "" {
		return nil, fmt.Errorf("DB_NAME is required")
	}

	return dbConfig, nil
}
