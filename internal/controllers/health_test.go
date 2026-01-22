package controllers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
	"word-flashcard/internal/models"
)

// healthControllerTestSuite contains all health controller tests
type healthControllerTestSuite struct {
	suite.Suite
	controller *HealthController
	router     *gin.Engine
}

// TestHealthController runs all health controller tests using the test suite
func TestHealthController(t *testing.T) {
	suite.Run(t, new(healthControllerTestSuite))
}

// SetupTest is called before each test method
func (s *healthControllerTestSuite) SetupTest() {
	setupHealthControllerTestLogging()

	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Initialize controller and router
	s.controller = NewHealthController()
	s.router = gin.New()

	// Register health route
	s.router.GET("/api/health", s.controller.HealthCheck)
}

// setupHealthControllerTestLogging configures logging for health controller tests
func setupHealthControllerTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// TestHealthCheckSuccess tests that the health check endpoint responds with 200 OK and correct data
func (s *healthControllerTestSuite) TestHealthCheckSuccess() {
	// Create a test request to the health endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	s.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 200 OK
	s.Equal(http.StatusOK, recorder.Code, "Health endpoint should respond with 200 OK")

	// Verify the response contains valid JSON with correct structure
	var response models.HealthResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	s.NoError(err, "Response should be valid JSON")

	// Verify the status field value
	s.Equal("OK", response.Status, "Health status should be 'OK'")

	// Verify content type header
	s.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}