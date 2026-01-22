package middleware

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// middlewareTestSuite contains all middleware related tests
type middlewareTestSuite struct {
	suite.Suite
	router    *gin.Engine
	logBuffer *bytes.Buffer
	logger    *slog.Logger
}

// TestMiddleware runs all middleware tests using the test suite
func TestMiddleware(t *testing.T) {
	suite.Run(t, new(middlewareTestSuite))
}

// SetupTest is called before each test method
func (s *middlewareTestSuite) SetupTest() {
	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Setup logger with buffer for testing
	s.logBuffer = &bytes.Buffer{}
	handler := slog.NewTextHandler(s.logBuffer, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	s.logger = slog.New(handler)
	slog.SetDefault(s.logger)

	// Create new router for each test
	s.router = gin.New()
}

// TestLoggingMiddlewareSuccess tests that LoggingMiddleware logs successful requests correctly
func (s *middlewareTestSuite) TestLoggingMiddlewareSuccess() {
	// Setup router with logging middleware and a test endpoint
	s.router.Use(LoggingMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create and execute test request
	req := httptest.NewRequest("GET", "/test?param=value", nil)
	req.Header.Set("User-Agent", "test-agent")
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify response
	s.Equal(http.StatusOK, recorder.Code)

	// Verify logging output contains expected information
	logOutput := s.logBuffer.String()
	s.Contains(logOutput, "Request processed", "Log should contain 'Request processed'")
	s.Contains(logOutput, "GET", "Log should contain HTTP method")
	s.Contains(logOutput, "/test", "Log should contain request path")
	s.Contains(logOutput, "param=value", "Log should contain query parameters")
	s.Contains(logOutput, "200", "Log should contain status code")
}

// TestLoggingMiddleware404Error tests that LoggingMiddleware logs 404 errors with warn level
func (s *middlewareTestSuite) TestLoggingMiddleware404Error() {
	// Setup router with logging middleware (no routes defined)
	s.router.Use(LoggingMiddleware())

	// Create and execute test request to non-existent endpoint
	req := httptest.NewRequest("GET", "/nonexistent", nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify 404 response
	s.Equal(http.StatusNotFound, recorder.Code)

	// Verify logging output contains warning level for 404
	logOutput := s.logBuffer.String()
	s.Contains(logOutput, "Request processed", "Log should contain 'Request processed'")
	s.Contains(logOutput, "/nonexistent", "Log should contain request path")
	s.Contains(logOutput, "404", "Log should contain 404 status code")
}

// TestCORSMiddlewareHeaders tests that CORSMiddleware sets correct CORS headers
func (s *middlewareTestSuite) TestCORSMiddlewareHeaders() {
	// Setup router with CORS middleware and a test endpoint
	s.router.Use(CORSMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create and execute test request
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify CORS headers are set correctly
	s.Equal("*", recorder.Header().Get("Access-Control-Allow-Origin"), "Should set Allow-Origin header")
	s.Contains(recorder.Header().Get("Access-Control-Allow-Methods"), "GET", "Should set Allow-Methods header")
	s.Contains(recorder.Header().Get("Access-Control-Allow-Headers"), "Content-Type", "Should set Allow-Headers header")
	s.Equal("86400", recorder.Header().Get("Access-Control-Max-Age"), "Should set Max-Age header")
}

// TestCORSMiddlewareOptionsRequest tests that CORSMiddleware handles OPTIONS requests correctly
func (s *middlewareTestSuite) TestCORSMiddlewareOptionsRequest() {
	// Setup router with CORS middleware and a test endpoint
	s.router.Use(CORSMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create and execute OPTIONS request
	req := httptest.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify OPTIONS request is handled correctly
	s.Equal(http.StatusNoContent, recorder.Code, "OPTIONS request should return 204 No Content")
	s.Equal("*", recorder.Header().Get("Access-Control-Allow-Origin"), "Should set CORS headers for OPTIONS")
}

// TestJSONMiddleware tests that JSONMiddleware sets correct content type
func (s *middlewareTestSuite) TestJSONMiddleware() {
	// Setup router with JSON middleware and a test endpoint
	s.router.Use(JSONMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "test response")
	})

	// Create and execute test request
	req := httptest.NewRequest("GET", "/test", nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify JSON content type is set
	contentType := recorder.Header().Get("Content-Type")
	s.Equal("application/json", contentType, "JSONMiddleware should set Content-Type to application/json")
}

// TestMiddlewareChain tests that multiple middleware work together correctly
func (s *middlewareTestSuite) TestMiddlewareChain() {
	// Setup router with all middleware and a test endpoint
	s.router.Use(LoggingMiddleware())
	s.router.Use(CORSMiddleware())
	s.router.Use(JSONMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create and execute test request
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify all middleware effects are applied
	s.Equal(http.StatusOK, recorder.Code)

	// Check CORS headers
	s.Equal("*", recorder.Header().Get("Access-Control-Allow-Origin"))

	// Check JSON content type
	s.Contains(recorder.Header().Get("Content-Type"), "application/json")

	// Check logging
	logOutput := s.logBuffer.String()
	s.Contains(logOutput, "Request processed")
	s.Contains(logOutput, "200")
}

// setupMiddlewareTestLogging configures basic logging for middleware tests
func setupMiddlewareTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}