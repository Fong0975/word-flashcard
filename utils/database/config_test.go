package database

import (
	"os"
	"path/filepath"
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
	envVars := []string{"DB_TYPE", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_PASSWORD_FILE", "DB_NAME", "TEST_VAR"}

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
	envVars := []string{"DB_TYPE", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_PASSWORD_FILE", "DB_NAME", "TEST_VAR"}
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

// TestLoadConfigWithPasswordFile tests that DB_PASSWORD is read from the
// Docker secret file named by DB_PASSWORD_FILE when it is set
func (suite *ConfigTestSuite) TestLoadConfigWithPasswordFile() {
	tests := []struct {
		name         string
		envPassword  string
		fileContent  string
		missingFile  bool
		wantPassword string
		wantErr      bool
	}{
		{
			name:         "Password read from secret file over env variable",
			envPassword:  "envpass",
			fileContent:  "filepass\n",
			wantPassword: "filepass",
		},
		{
			name:        "Unreadable secret file returns error",
			envPassword: "envpass",
			missingFile: true,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			path := filepath.Join(suite.T().TempDir(), "db_password")
			if !tt.missingFile {
				suite.Require().NoError(os.WriteFile(path, []byte(tt.fileContent), 0o600))
			}
			os.Setenv("DB_PASSWORD", tt.envPassword)
			os.Setenv("DB_PASSWORD_FILE", path)

			config, err := LoadConfig()

			if tt.wantErr {
				suite.Error(err, "Expected error for unreadable DB_PASSWORD_FILE")
				return
			}
			suite.Require().NoError(err, "LoadConfig() should not return error")
			suite.Equal(tt.wantPassword, config.Password)
		})
	}
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
