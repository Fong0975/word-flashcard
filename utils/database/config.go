package database

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds database configuration
type Config struct {
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
func LoadConfig() (*Config, error) {
	config := &Config{
		// Fixed values
		SSLMode:      "disable",
		TablePrefix:  "wfc_",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	// Load from environment variables
	config.Type = getEnvOrDefault("DB_TYPE", "mysql")
	config.Host = getEnvOrDefault("DB_HOST", "localhost")
	config.User = getEnvOrDefault("DB_USER", "root")
	config.Password = getEnvOrDefault("DB_PASSWORD", "")
	config.DatabaseName = getEnvOrDefault("DB_NAME", "word_flashcard")

	// Parse port
	portStr := getEnvOrDefault("DB_PORT", "3306")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}
	config.Port = port

	// Validate required fields
	if config.Type == "" {
		return nil, fmt.Errorf("DB_TYPE is required")
	}
	if config.Host == "" {
		return nil, fmt.Errorf("DB_HOST is required")
	}
	if config.User == "" {
		return nil, fmt.Errorf("DB_USER is required")
	}
	if config.DatabaseName == "" {
		return nil, fmt.Errorf("DB_NAME is required")
	}

	// Validate database type
	if config.Type != "mysql" && config.Type != "postgresql" {
		return nil, fmt.Errorf("unsupported database type: %s", config.Type)
	}

	return config, nil
}

// getEnvOrDefault returns environment variable value or default
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
