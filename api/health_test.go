package api

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/suite"
)

// healthTestSuite contains all health-related tests
type healthTestSuite struct {
	suite.Suite
}

// TestHealthService runs all health tests using the test suite
func TestHealthService(t *testing.T) {
	suite.Run(t, new(healthTestSuite))
}

// SetupTest is called before each test method
func (s *healthTestSuite) SetupTest() {
	setupHealthTestLogging()
}

// setupHealthTestLogging configures logging for health tests
func setupHealthTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// TestHealthEndpointSuccess tests that the health endpoint successfully responds with 200 status code
func (s *healthTestSuite) TestHealthEndpointSuccess() {
	// Create a new ServeMux for testing
	mux := http.NewServeMux()

	// Create a HealthHandler instance
	healthHandler := &HealthHandler{}

	// Register the health handler
	healthHandler.Register(mux)

	// Create a test request to the health endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the mux
	mux.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 200 OK
	s.Equal(http.StatusOK, recorder.Code, "Health endpoint should respond with 200 OK")
}