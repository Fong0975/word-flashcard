package config

import (
	"os"
	"strconv"
)

// GetOrDefault retrieves the value of the environment variable named by the key.
func GetOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetOrDefaultInt retrieves the integer value of the environment variable named by the key.
func GetOrDefaultInt(key string, defaultValue int) int {
	// Get the string value
	strVal := GetOrDefault(key, "")
	if strVal == "" {
		return defaultValue
	}

	// Convert to int
	intVal, err := strconv.Atoi(strVal)
	if err != nil {
		return defaultValue
	}

	return intVal
}
