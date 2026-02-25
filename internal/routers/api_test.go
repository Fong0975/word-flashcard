package routers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"word-flashcard/internal/mocks"

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

	// Create mock controllers
	mockHealthController := mocks.NewMockHealthController()
	mockDictionaryController := mocks.NewMockDictionaryController()
	mockWordController := mocks.NewMockWordController()
	mockQuestionController := mocks.NewMockQuestionController()

	// Create controller dependencies with mock controllers
	deps := &ControllerDependencies{
		HealthController:     mockHealthController,
		DictionaryController: mockDictionaryController,
		WordController:       mockWordController,
		QuestionController:   mockQuestionController,
	}

	// Create a new gin router and setup API routes with mock controllers
	s.router = gin.New()
	SetupAPIRoutesWithDependencies(s.router, deps)
}

// setupAPIRoutesTestLogging configures logging for API routes tests
func setupAPIRoutesTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// TestAPIRouteMappings tests that all API routes are properly registered and call correct methods
func (s *apiRoutesTestSuite) TestAPIRouteMappings() {
	// Define all expected route mappings with expected method names
	routeMappings := []struct {
		method             string
		path               string
		desc               string
		expectedMethod     string
		expectedController string
	}{
		{"GET", "/api/health", "HealthController.HealthCheck", "HealthCheck", "HealthController"},
		{"GET", "/api/dictionary/test", "DictionaryController.SearchWord", "SearchWord", "DictionaryController"},
		// Words
		{"GET", "/api/words", "WordController.ListWords", "ListWords", "WordController"},
		{"POST", "/api/words/search", "WordController.SearchWords", "SearchWords", "WordController"},
		{"POST", "/api/words/random", "WordController.RandomWords", "RandomWords", "WordController"},
		{"POST", "/api/words", "WordController.CreateWord", "CreateWord", "WordController"},
		{"POST", "/api/words/definition/1", "WordController.CreateWordDefinition", "CreateWordDefinition", "WordController"},
		{"PUT", "/api/words/1", "WordController.UpdateWord", "UpdateWord", "WordController"},
		{"PUT", "/api/words/definition/1", "WordController.UpdateWordDefinition", "UpdateWordDefinition", "WordController"},
		{"DELETE", "/api/words/1", "WordController.DeleteWord", "DeleteWord", "WordController"},
		{"DELETE", "/api/words/definition/1", "WordController.DeleteWordDefinition", "DeleteWordDefinition", "WordController"},
		{"POST", "/api/words/count", "WordController.CountWords", "CountWords", "WordController"},
		// Questions
		{"GET", "/api/questions", "QuestionController.ListQuestions", "ListQuestions", "QuestionController"},
		{"GET", "/api/questions/1", "QuestionController.GetQuestions", "GetQuestions", "QuestionController"},
		{"POST", "/api/questions/random", "QuestionController.RandomQuestions", "RandomQuestions", "QuestionController"},
		{"POST", "/api/questions", "QuestionController.CreateQuestions", "CreateQuestions", "QuestionController"},
		{"PUT", "/api/questions/1", "QuestionController.UpdateQuestions", "UpdateQuestions", "QuestionController"},
		{"DELETE", "/api/questions/1", "QuestionController.DeleteQuestions", "DeleteQuestions", "QuestionController"},
		{"GET", "/api/questions/count", "QuestionController.CountQuestions", "CountQuestions", "QuestionController"},
	}

	// Test each route mapping calls the correct method
	for _, mapping := range routeMappings {
		s.Run(mapping.desc, func() {
			req := httptest.NewRequest(mapping.method, mapping.path, nil)
			recorder := httptest.NewRecorder()

			s.router.ServeHTTP(recorder, req)

			// Route should exist (not return 404)
			s.NotEqual(http.StatusNotFound, recorder.Code,
				"Route %s %s should be registered (maps to %s)",
				mapping.method, mapping.path, mapping.desc)

			// Parse JSON response to verify correct method was called
			var responseData map[string]interface{}
			err := json.Unmarshal(recorder.Body.Bytes(), &responseData)
			s.NoError(err, "Response should be valid JSON")

			// Verify the correct controller method was called
			s.Equal(mapping.expectedMethod, responseData["method"],
				"Route %s %s should call method %s, but called %v",
				mapping.method, mapping.path, mapping.expectedMethod, responseData["method"])

			s.Equal(mapping.expectedController, responseData["controller"],
				"Route %s %s should call controller %s, but called %v",
				mapping.method, mapping.path, mapping.expectedController, responseData["controller"])
		})
	}
}
