package routers

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// apiRoutesTestSuite contains all API routes related tests
type apiRoutesTestSuite struct {
	suite.Suite
	router *gin.Engine
}

// TestAPIRoutes runs all API routes tests using the test suite
func TestAPIRoutes(t *testing.T) {
	suite.Run(t, new(apiRoutesTestSuite))
}

// SetupTest is called before each test method
func (s *apiRoutesTestSuite) SetupTest() {
	setupAPIRoutesTestLogging()

	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a new gin router and setup API routes
	s.router = gin.New()
	SetupAPIRoutes(s.router)
}

// setupAPIRoutesTestLogging configures logging for API routes tests
func setupAPIRoutesTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// TestAPIHealthRouteRegistration tests that health route is properly registered
func (s *apiRoutesTestSuite) TestAPIHealthRouteRegistration() {
	// Create a test request to the health endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the router
	s.router.ServeHTTP(recorder, req)

	// Verify that the route is registered and responds successfully
	s.Equal(http.StatusOK, recorder.Code, "Health route should be registered and return 200")

	// Verify JSON content type is set by middleware
	s.Contains(recorder.Header().Get("Content-Type"), "application/json", "Health route should have JSON content type")
}

// TestAPIDictionaryRouteRegistration tests that dictionary route is properly registered
func (s *apiRoutesTestSuite) TestAPIDictionaryRouteRegistration() {
	// Create a test request to the dictionary endpoint
	req := httptest.NewRequest("GET", "/api/dictionary/test", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the router
	s.router.ServeHTTP(recorder, req)

	// Verify that the route is registered (not 404)
	// May return 500 due to external API dependency, but route should exist
	s.NotEqual(http.StatusNotFound, recorder.Code, "Dictionary route should be registered")

	// Verify JSON content type is set by middleware
	s.Contains(recorder.Header().Get("Content-Type"), "application/json", "Dictionary route should have JSON content type")
}

// TestAPIGroupPathPrefix tests that API routes are properly grouped under /api prefix
func (s *apiRoutesTestSuite) TestAPIGroupPathPrefix() {
	testCases := []struct {
		name     string
		path     string
		expected int // expected status code (not 404 means route exists)
	}{
		{
			name:     "Health endpoint with correct prefix",
			path:     "/api/health",
			expected: http.StatusOK,
		},
		{
			name:     "Dictionary endpoint with correct prefix",
			path:     "/api/dictionary/hello",
			expected: http.StatusInternalServerError, // External API error, but route exists
		},
		{
			name:     "Health endpoint without prefix should not exist",
			path:     "/health",
			expected: http.StatusNotFound,
		},
		{
			name:     "Dictionary endpoint without prefix should not exist",
			path:     "/dictionary/hello",
			expected: http.StatusNotFound,
		},
	}

	for _, tc := range testCases {
		s.Run(tc.name, func() {
			req := httptest.NewRequest("GET", tc.path, nil)
			recorder := httptest.NewRecorder()

			s.router.ServeHTTP(recorder, req)

			if tc.expected == http.StatusNotFound {
				s.Equal(http.StatusNotFound, recorder.Code, "Route without /api prefix should not exist")
			} else {
				s.NotEqual(http.StatusNotFound, recorder.Code, "Route with /api prefix should exist")
			}
		})
	}
}

// TestAPIJSONMiddlewareApplication tests that JSON middleware is applied to API routes
func (s *apiRoutesTestSuite) TestAPIJSONMiddlewareApplication() {
	// Test health endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify JSON content type is set
	contentType := recorder.Header().Get("Content-Type")
	s.Contains(contentType, "application/json", "API routes should have JSON content type set by middleware")
}

// TestControllerInitialization tests that controllers are properly initialized
func (s *apiRoutesTestSuite) TestControllerInitialization() {
	// This test ensures SetupAPIRoutes doesn't panic and properly initializes controllers
	s.NotPanics(func() {
		router := gin.New()
		SetupAPIRoutes(router)
	}, "SetupAPIRoutes should not panic when initializing controllers")
}