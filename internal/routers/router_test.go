package routers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"word-flashcard/internal/mocks"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// Testcase defines a test case structure
type RouterTestcase struct {
	name           string
	method         string
	path           string
	expectedStatus int
}

// routerTestSuite contains all router related tests
type routerTestSuite struct {
	suite.Suite
	router *gin.Engine
}

// TestRouter runs all router tests using the test suite
func TestRouter(t *testing.T) {
	suite.Run(t, new(routerTestSuite))
}

// SetupTest is called before each test method
func (s *routerTestSuite) SetupTest() {
	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a new gin router
	s.router = gin.New()
}

// TestSetupWebRoutes tests the web & static routes setup
func (s *routerTestSuite) TestSetupWebRoutes() {
	// Create mock web handler
	mockWebHandler := mocks.NewMockWebHandler()
	// Setup web routes with mock handler
	setupWebRoutes(s.router, mockWebHandler)

	testcases := []RouterTestcase{
		{"WebRoute - index page", "GET", "/", http.StatusOK},
		{"WebRoute - static file", "GET", "/static/test.css", http.StatusNotFound},
	}

	for _, testcase := range testcases {
		s.Run(testcase.name, func() {
			routeMappingTest(testcase.method, testcase.path, testcase.expectedStatus, s)
		})
	}
}

// TestSetupSwaggerRoutes tests the Swagger routes setup
func (s *routerTestSuite) TestSetupSwaggerRoutes() {
	setupSwaggerRoutes(s.router)

	testcases := []RouterTestcase{
		{"SwaggerRoute - with filename", "GET", "/swagger/index.html", http.StatusOK},
		{"SwaggerRoute - without filename", "GET", "/swagger", http.StatusFound},
	}

	for _, testcase := range testcases {
		s.Run(testcase.name, func() {
			routeMappingTest(testcase.method, testcase.path, testcase.expectedStatus, s)
		})
	}
}

// routeMappingTest tests a single route mapping
func routeMappingTest(method string, path string, expectedCode int, s *routerTestSuite) {
	req := httptest.NewRequest(method, path, nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	// Verify the response code
	s.Equal(expectedCode, recorder.Code,
		"Route %s %s should return status %d, but got %d",
		method, path, expectedCode, recorder.Code)
}