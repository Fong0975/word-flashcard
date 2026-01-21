package api

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/stretchr/testify/suite"
)

// routerTestSuite contains all router-related tests
type routerTestSuite struct {
	suite.Suite
}

// TestRouterService runs all router tests using the test suite
func TestRouterService(t *testing.T) {
	suite.Run(t, new(routerTestSuite))
}

// SetupTest is called before each test method
func (s *routerTestSuite) SetupTest() {
	setupTestLogging()
}

// setupTestLogging configures logging for tests to avoid output during testing
func setupTestLogging() {
	// Create a logger that discards output during tests
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError, // Only show errors during tests
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// TestGetModules tests the GetModules function
func (s *routerTestSuite) TestGetModules() {
	modules := GetModules()

	// Verify that we get exactly 2 modules
	s.Len(modules, 2, "Should return exactly 2 modules")

	// Verify the types of the modules
	expectedTypes := []string{"*api.DictionaryHandler", "*api.HealthHandler"}
	actualTypes := make([]string, len(modules))

	for i, module := range modules {
		actualTypes[i] = reflect.TypeOf(module).String()
	}

	// Check if we have the expected module types
	for _, expectedType := range expectedTypes {
		found := false
		for _, actualType := range actualTypes {
			if actualType == expectedType {
				found = true
				break
			}
		}
		s.True(found, "Expected to find module type %s, but it was not found in %v", expectedType, actualTypes)
	}
}

// TestRegisterAPIMethod tests the RegisterAPIMethod function
func (s *routerTestSuite) TestRegisterAPIMethod() {
	// Create a new ServeMux for testing
	mux := http.NewServeMux()

	// Create a simple test handler
	testHandlerCalled := false
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		testHandlerCalled = true
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"test": "response"}`))
	}

	// Register a test API method
	method := "GET"
	path := "test/endpoint"
	RegisterAPIMethod(mux, method, path, testHandler)

	// Create a test request
	expectedURL := "/api/test/endpoint"
	req := httptest.NewRequest(method, expectedURL, nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the mux
	mux.ServeHTTP(recorder, req)

	// Verify the response
	s.Equal(http.StatusOK, recorder.Code, "Expected HTTP 200 status")

	// Verify the Content-Type header is set
	contentType := recorder.Header().Get("Content-Type")
	expectedContentType := "application/json"
	s.Equal(expectedContentType, contentType, "Expected Content-Type to be application/json")

	// Verify our test handler was called
	s.True(testHandlerCalled, "Expected test handler to be called")

	// Verify the response body
	responseBody := strings.TrimSpace(recorder.Body.String())
	expectedBody := `{"test": "response"}`
	s.Equal(expectedBody, responseBody, "Expected response body to match")
}

// TestRegisterAPIMethodWithQueryParams tests RegisterAPIMethod with query parameters
func (s *routerTestSuite) TestRegisterAPIMethodWithQueryParams() {
	// Create a new ServeMux for testing
	mux := http.NewServeMux()

	// Create a test handler that captures the request
	var capturedRequest *http.Request
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		capturedRequest = r
		w.WriteHeader(http.StatusOK)
	}

	// Register a test API method
	RegisterAPIMethod(mux, "GET", "test", testHandler)

	// Create a test request with query parameters
	req := httptest.NewRequest("GET", "/api/test?param=value", nil)
	recorder := httptest.NewRecorder()

	// Execute the request
	mux.ServeHTTP(recorder, req)

	// Verify the request was captured and processed correctly
	s.NotNil(capturedRequest, "Expected request to be captured")

	s.Equal("param=value", capturedRequest.URL.RawQuery, "Expected query params to match")
}

// mockLogBuffer captures log output for testing
type mockLogBuffer struct {
	buffer bytes.Buffer
}

func (m *mockLogBuffer) Write(p []byte) (n int, err error) {
	return m.buffer.Write(p)
}

// TestRegisterAPIMethodLogging tests that RegisterAPIMethod performs proper logging
func (s *routerTestSuite) TestRegisterAPIMethodLogging() {
	// Setup mock logging
	logBuffer := &mockLogBuffer{}
	handler := slog.NewTextHandler(logBuffer, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)

	// Create a new ServeMux
	mux := http.NewServeMux()

	// Register a test method
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}

	RegisterAPIMethod(mux, "POST", "test/logging", testHandler)

	// Make a request to trigger logging
	req := httptest.NewRequest("POST", "/api/test/logging?debug=true", nil)
	recorder := httptest.NewRecorder()
	mux.ServeHTTP(recorder, req)

	// Verify that logging occurred
	logOutput := logBuffer.buffer.String()

	// Check for debug log (method registration)
	s.Contains(logOutput, "Registering method", "Expected debug log about method registration")

	// Check for info log (request received)
	s.Contains(logOutput, "Received request", "Expected info log about received request")

	// Reset logging for other tests
	setupTestLogging()
}