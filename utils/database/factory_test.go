package database

import (
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
)

// factoryTestSuite testing suite components
type factoryTestSuite struct {
	suite.Suite
	t *testing.T
}

// TestFactorySuite runs the test suite
func TestFactorySuite(t *testing.T) {
	suite.Run(t, new(factoryTestSuite))
}

// SetupTest for the test suite
func (s *factoryTestSuite) SetupTest() {
	s.t = s.T()
}

// Test create different database instances based on configuration
func (suite *factoryTestSuite) TestNewDatabase() {
	// Test with nil config
	db, err := NewDatabase(nil)
	if err == nil {
		suite.t.Error("Expected error for nil config, got nil")
	}
	if db != nil {
		suite.t.Error("Expected nil database instance for nil config")
	}

	// Test with valid MySQL config
	mysqlConfig := &DBConfig{
		Type:         "mysql",
		Host:         "localhost",
		Port:         3306,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		SSLMode:      "disable",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	db, err = NewDatabase(mysqlConfig)
	if err != nil {
		suite.t.Errorf("NewDatabase() failed for MySQL config: %v", err)
	}
	if db == nil {
		suite.t.Error("Expected non-nil database instance for valid MySQL config")
	}

	// Test with valid PostgreSQL config
	postgresConfig := &DBConfig{
		Type:         "postgresql",
		Host:         "localhost",
		Port:         5432,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		SSLMode:      "disable",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	db, err = NewDatabase(postgresConfig)
	if err != nil {
		suite.t.Errorf("NewDatabase() failed for PostgreSQL config: %v", err)
	}
	if db == nil {
		suite.t.Error("Expected non-nil database instance for valid PostgreSQL config")
	}

	// Test with unsupported database type
	invalidConfig := &DBConfig{
		Type:         "oracle",
		Host:         "localhost",
		Port:         1521,
		User:         "testuser",
		Password:     "testpass",
		DatabaseName: "testdb",
		SSLMode:      "disable",
		MaxOpenConns: 25,
		MaxIdleConns: 25,
	}

	db, err = NewDatabase(invalidConfig)
	if err == nil {
		suite.t.Error("Expected error for unsupported database type, got nil")
	}
	if db != nil {
		suite.t.Error("Expected nil database instance for unsupported database type")
	}
}

// Test creating database instance from environment variables
func (suite *factoryTestSuite) TestNewDatabaseFromEnv() {
	// Set up valid environment variables
	os.Setenv("DB_TYPE", "mysql")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "3306")
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

	db, err := NewDatabaseFromEnv()
	if err != nil {
		suite.t.Errorf("NewDatabaseFromEnv() failed: %v", err)
	}
	if db == nil {
		suite.t.Error("Expected non-nil database instance from environment variables")
	}
}

// Test creating database instance with invalid environment variables
func (suite *factoryTestSuite) TestNewDatabaseFromEnvWithInvalidEnvironment() {
	// Set invalid environment variables
	os.Setenv("DB_PORT", "invalid_port")
	defer os.Unsetenv("DB_PORT")

	db, err := NewDatabaseFromEnv()
	if err == nil {
		suite.t.Error("Expected error for invalid environment variables, got nil")
	}
	if db != nil {
		suite.t.Error("Expected nil database instance for invalid environment variables")
	}
}