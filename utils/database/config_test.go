package database

import (
	"os"
	"testing"
	"word-flashcard/utils/config"
)

// Test loading default configuration values from environment variables
func TestLoadConfig(t *testing.T) {
	// Clear environment variables to ensure clean test environment
	envVars := []string{"DB_TYPE", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"}
	for _, env := range envVars {
		os.Unsetenv(env)
	}

	// Test default values
	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig() failed: %v", err)
	}

	// Verify default values
	if config.Type != "mysql" {
		t.Errorf("Expected Type=mysql, got %s", config.Type)
	}
	if config.Host != "localhost" {
		t.Errorf("Expected Host=localhost, got %s", config.Host)
	}
	if config.Port != 3306 {
		t.Errorf("Expected Port=3306, got %d", config.Port)
	}
	if config.User != "root" {
		t.Errorf("Expected User=root, got %s", config.User)
	}
	if config.DatabaseName != "word_flashcard" {
		t.Errorf("Expected DatabaseName=word_flashcard, got %s", config.DatabaseName)
	}
	if config.SSLMode != "disable" {
		t.Errorf("Expected SSLMode=disable, got %s", config.SSLMode)
	}
	if config.TablePrefix != "wfc_" {
		t.Errorf("Expected TablePrefix=wfc_, got %s", config.TablePrefix)
	}
	if config.MaxOpenConns != 25 {
		t.Errorf("Expected MaxOpenConns=25, got %d", config.MaxOpenConns)
	}
	if config.MaxIdleConns != 25 {
		t.Errorf("Expected MaxIdleConns=25, got %d", config.MaxIdleConns)
	}
}

// Tests the configuration loading of custom environment variables
func TestLoadConfigWithCustomEnvironmentVariables(t *testing.T) {
	// Set custom environment variables
	os.Setenv("DB_TYPE", "postgresql")
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_NAME", "testdb")

	defer func() {
		os.Unsetenv("DB_TYPE")
		os.Unsetenv("DB_HOST")
		os.Unsetenv("DB_PORT")
		os.Unsetenv("DB_USER")
		os.Unsetenv("DB_PASSWORD")
		os.Unsetenv("DB_NAME")
	}()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig() failed: %v", err)
	}

	if config.Type != "postgresql" {
		t.Errorf("Expected Type=postgresql, got %s", config.Type)
	}
	if config.Host != "testhost" {
		t.Errorf("Expected Host=testhost, got %s", config.Host)
	}
	if config.Port != 5432 {
		t.Errorf("Expected Port=5432, got %d", config.Port)
	}
	if config.User != "testuser" {
		t.Errorf("Expected User=testuser, got %s", config.User)
	}
	if config.Password != "testpass" {
		t.Errorf("Expected Password=testpass, got %s", config.Password)
	}
	if config.DatabaseName != "testdb" {
		t.Errorf("Expected DatabaseName=testdb, got %s", config.DatabaseName)
	}
}

// Test error handling for invalid port number
func TestLoadConfigWithInvalidPort(t *testing.T) {
	os.Setenv("DB_PORT", "invalid")
	defer os.Unsetenv("DB_PORT")

	_, err := LoadConfig()
	if err == nil {
		t.Error("Expected error for invalid port, got nil")
	}
}

// Test unsupported database type
func TestLoadConfigWithUnsupportedDatabaseType(t *testing.T) {
	os.Setenv("DB_TYPE", "oracle")
	defer os.Unsetenv("DB_TYPE")

	_, err := LoadConfig()
	if err == nil {
		t.Error("Expected error for unsupported database type, got nil")
	}
}

// Test reading environment variable with default fallback
func TestGetEnvOrDefault(t *testing.T) {
	// Test case when environment variable exists
	os.Setenv("TEST_VAR", "test_value")
	defer os.Unsetenv("TEST_VAR")

	result := config.GetOrDefault("TEST_VAR", "default_value")
	if result != "test_value" {
		t.Errorf("Expected test_value, got %s", result)
	}

	// Test case when environment variable does not exist
	result = config.GetOrDefault("NON_EXISTENT_VAR", "default_value")
	if result != "default_value" {
		t.Errorf("Expected default_value, got %s", result)
	}
}