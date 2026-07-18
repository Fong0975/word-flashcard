package routers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"word-flashcard/internal/models"

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

// TestSetupRouter tests that SetupRouter wires middleware, API routes,
// Swagger routes, and error handlers together into a working engine.
func (s *routerTestSuite) TestSetupRouter() {
	router, err := SetupRouter()
	s.NoError(err)
	s.NotNil(router)

	// Swagger routes registered by SetupRouter should work end-to-end.
	req := httptest.NewRequest(http.MethodGet, "/swagger", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	s.Equal(http.StatusFound, recorder.Code)

	// Unmatched routes should hit the error handlers registered by SetupRouter.
	req = httptest.NewRequest(http.MethodGet, "/no-such-route", nil)
	recorder = httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	s.Equal(http.StatusNotFound, recorder.Code)
}

// TestSetMiddleware tests that the global middleware stack is wired in.
func (s *routerTestSuite) TestSetMiddleware() {
	setMiddleware(s.router)

	// A route that panics should be recovered by RecoveryMiddleware, and the
	// response should still carry the CORS headers added upstream.
	s.router.GET("/panic-test", func(c *gin.Context) {
		panic("boom")
	})

	req := httptest.NewRequest(http.MethodGet, "/panic-test", nil)
	recorder := httptest.NewRecorder()
	s.router.ServeHTTP(recorder, req)

	s.Equal(http.StatusInternalServerError, recorder.Code)
	s.Equal("*", recorder.Header().Get("Access-Control-Allow-Origin"))
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

// TestSetupErrorHandlers tests that unmatched routes and methods respond
// with the shared {"error","code"} JSON shape instead of gin's defaults.
func (s *routerTestSuite) TestSetupErrorHandlers() {
	setupErrorHandlers(s.router)
	s.router.GET("/known", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Unknown route -> NoRoute handler
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	recorder := httptest.NewRecorder()
	s.router.ServeHTTP(recorder, req)

	s.Equal(http.StatusNotFound, recorder.Code)
	var notFoundBody models.ErrorResponse
	s.NoError(json.Unmarshal(recorder.Body.Bytes(), &notFoundBody))
	s.Equal(models.ErrCodeNotFound, notFoundBody.Code)

	// Known route with the wrong method -> NoMethod handler
	req = httptest.NewRequest(http.MethodPost, "/known", nil)
	recorder = httptest.NewRecorder()
	s.router.ServeHTTP(recorder, req)

	s.Equal(http.StatusMethodNotAllowed, recorder.Code)
	var methodNotAllowedBody models.ErrorResponse
	s.NoError(json.Unmarshal(recorder.Body.Bytes(), &methodNotAllowedBody))
	s.Equal(models.ErrCodeInvalidRequest, methodNotAllowedBody.Code)
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
