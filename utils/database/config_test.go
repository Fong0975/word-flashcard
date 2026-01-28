package database

import (
	"os"
	"testing"
	"word-flashcard/utils/config"

	"github.com/stretchr/testify/suite"
)

// ConfigTestSuite represents the database config test suite
type ConfigTestSuite struct {
	suite.Suite
	originalEnvVars map[string]string
}

// TestConfigSuite runs the config test suite
func TestConfigSuite(t *testing.T) {
	suite.Run(t, new(ConfigTestSuite))
}

// SetupTest runs before each test to prepare clean environment
func (suite *ConfigTestSuite) SetupTest() {
	// Store original environment variables
	suite.originalEnvVars = make(map[string]string)
	envVars := []string{"DB_TYPE", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "TEST_VAR"}

	for _, env := range envVars {
		if value, exists := os.LookupEnv(env); exists {
			suite.originalEnvVars[env] = value
		}
		os.Unsetenv(env)
	}
}

// TearDownTest runs after each test to restore environment
func (suite *ConfigTestSuite) TearDownTest() {
	// Clear all test environment variables
	envVars := []string{"DB_TYPE", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "TEST_VAR"}
	for _, env := range envVars {
		os.Unsetenv(env)
	}

	// Restore original environment variables
	for env, value := range suite.originalEnvVars {
		os.Setenv(env, value)
	}
}

// TestLoadConfigDefaults tests loading default configuration values
func (suite *ConfigTestSuite) TestLoadConfigDefaults() {
	config, err := LoadConfig()
	suite.Require().NoError(err, "LoadConfig() should not return error")

	// Verify default values
	suite.Equal("mysql", config.Type, "Expected Type=mysql")
	suite.Equal("localhost", config.Host, "Expected Host=localhost")
	suite.Equal(3306, config.Port, "Expected Port=3306")
	suite.Equal("root", config.User, "Expected User=root")
	suite.Equal("word_flashcard", config.DatabaseName, "Expected DatabaseName=word_flashcard")
	suite.Equal("disable", config.SSLMode, "Expected SSLMode=disable")
	suite.Equal(25, config.MaxOpenConns, "Expected MaxOpenConns=25")
	suite.Equal(25, config.MaxIdleConns, "Expected MaxIdleConns=25")
}

// TestLoadConfigWithCustomEnvironmentVariables tests configuration loading with custom environment variables
func (suite *ConfigTestSuite) TestLoadConfigWithCustomEnvironmentVariables() {
	// Set custom environment variables
	os.Setenv("DB_TYPE", "postgresql")
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_NAME", "testdb")

	config, err := LoadConfig()
	suite.Require().NoError(err, "LoadConfig() should not return error")

	suite.Equal("postgresql", config.Type, "Expected Type=postgresql")
	suite.Equal("testhost", config.Host, "Expected Host=testhost")
	suite.Equal(5432, config.Port, "Expected Port=5432")
	suite.Equal("testuser", config.User, "Expected User=testuser")
	suite.Equal("testpass", config.Password, "Expected Password=testpass")
	suite.Equal("testdb", config.DatabaseName, "Expected DatabaseName=testdb")
}

// TestLoadConfigWithInvalidPort tests error handling for invalid port number
func (suite *ConfigTestSuite) TestLoadConfigWithInvalidPort() {
	os.Setenv("DB_PORT", "invalid")

	_, err := LoadConfig()
	suite.Error(err, "Expected error for invalid port")
}

// TestLoadConfigWithUnsupportedDatabaseType tests error handling for unsupported database type
func (suite *ConfigTestSuite) TestLoadConfigWithUnsupportedDatabaseType() {
	os.Setenv("DB_TYPE", "oracle")

	_, err := LoadConfig()
	suite.Error(err, "Expected error for unsupported database type")
}

// TestGetEnvOrDefaultWithExistingVar tests reading environment variable when it exists
func (suite *ConfigTestSuite) TestGetEnvOrDefaultWithExistingVar() {
	os.Setenv("TEST_VAR", "test_value")

	result := config.GetOrDefault("TEST_VAR", "default_value")
	suite.Equal("test_value", result, "Expected environment variable value")
}

// TestGetEnvOrDefaultWithNonExistentVar tests reading environment variable with default fallback
func (suite *ConfigTestSuite) TestGetEnvOrDefaultWithNonExistentVar() {
	result := config.GetOrDefault("NON_EXISTENT_VAR", "default_value")
	suite.Equal("default_value", result, "Expected default value")
}
