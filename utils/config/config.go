package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
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

// GetOrDefaultBool retrieves the boolean value of the environment variable named by the key.
func GetOrDefaultBool(key string, defaultValue bool) bool {
	// Get the string value
	strVal := GetOrDefault(key, "")
	if strVal == "" {
		return defaultValue
	}

	// Convert to bool
	boolVal, err := strconv.ParseBool(strVal)
	if err != nil {
		return defaultValue
	}

	return boolVal
}

// GetSecretOrDefault retrieves a secret value, preferring the file named by the
// `<key>_FILE` environment variable (the Docker secrets convention, e.g.
// `/run/secrets/db_password`) over the plain `<key>` environment variable, so a
// secret mounted into the container never has to appear in its environment.
//
// Trailing CR/LF is trimmed from the file contents because secret files are
// commonly written with a terminating newline; other whitespace is kept since
// it may be part of the secret itself. An empty file yields defaultValue.
//
// Returns an error only when `<key>_FILE` is set but the file cannot be read;
// when it is unset, this behaves like GetOrDefault(key, defaultValue).
func GetSecretOrDefault(key, defaultValue string) (string, error) {
	fileKey := key + "_FILE"
	path := os.Getenv(fileKey)
	if path == "" {
		return GetOrDefault(key, defaultValue), nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read %s: %w", fileKey, err)
	}

	if value := strings.TrimRight(string(data), "\r\n"); value != "" {
		return value, nil
	}
	return defaultValue, nil
}
