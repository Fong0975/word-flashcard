package config

import "os"

// GetOrDefault retrieves the value of the environment variable named by the key.
func GetOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
