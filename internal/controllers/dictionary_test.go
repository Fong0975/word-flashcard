package controllers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
	"word-flashcard/internal/models"
)

// dictionaryControllerTestSuite contains all dictionary controller tests
type dictionaryControllerTestSuite struct {
	suite.Suite
	controller          *DictionaryController
	router              *gin.Engine
	mockCambridgeServer *httptest.Server
	originalPort        string
}

// TestDictionaryController runs all dictionary controller tests using the test suite
func TestDictionaryController(t *testing.T) {
	suite.Run(t, new(dictionaryControllerTestSuite))
}

// SetupTest is called before each test method
func (s *dictionaryControllerTestSuite) SetupTest() {
	setupDictionaryControllerTestLogging()

	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Clear cache before each test
	s.controller = NewDictionaryController()

	// Initialize router
	s.router = gin.New()

	// Register dictionary route
	s.router.GET("/api/dictionary/:word", s.controller.SearchWord)

	// Store original port and setup mock server
	s.originalPort = os.Getenv("CAMBRIDGE_API_PORT")
	s.setupMockCambridgeServer()
}

// TearDownTest is called after each test method
func (s *dictionaryControllerTestSuite) TearDownTest() {
	if s.mockCambridgeServer != nil {
		s.mockCambridgeServer.Close()
	}
	// Restore original environment variable
	if s.originalPort != "" {
		os.Setenv("CAMBRIDGE_API_PORT", s.originalPort)
	} else {
		os.Unsetenv("CAMBRIDGE_API_PORT")
	}
}

// setupDictionaryControllerTestLogging configures logging for dictionary controller tests
func setupDictionaryControllerTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// setupMockCambridgeServer creates a mock server that simulates Cambridge API responses
func (s *dictionaryControllerTestSuite) setupMockCambridgeServer() {
	s.mockCambridgeServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock Cambridge API response for successful word lookup
		if strings.Contains(r.URL.Path, "/api/dictionary/en-tw/hello") {
			mockResponse := models.CambridgeResponse{
				Word: "hello",
				POS:  []string{"noun", "verb"},
				Pronunciation: []models.CambridgePronunciation{
					{
						POS:  "noun",
						Lang: "en",
						URL:  "http://example.com/audio/hello.mp3",
						Pron: "/həˈloʊ/",
					},
				},
				Definition: []models.CambridgeDefinition{
					{
						ID:          1,
						POS:         "noun",
						Text:        "a greeting",
						Translation: "問候",
						Example: []models.CambridgeExample{
							{
								ID:          1,
								Text:        "hello there!",
								Translation: "你好！",
							},
						},
					},
				},
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(mockResponse)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	// Extract port from mock server URL and set environment variable
	// The mock server URL format is http://127.0.0.1:port
	serverURL := s.mockCambridgeServer.URL
	// Extract port from URL like "http://127.0.0.1:12345"
	port := serverURL[len("http://127.0.0.1:"):]
	os.Setenv("CAMBRIDGE_API_PORT", port)
}

// TestSearchWordSuccess tests that SearchWord successfully handles a valid word request
func (s *dictionaryControllerTestSuite) TestSearchWordSuccess() {
	// Create a test request to search for the word "hello"
	req := httptest.NewRequest("GET", "/api/dictionary/hello", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	s.router.ServeHTTP(recorder, req)

	// Verify the response status code is 200 OK
	s.Equal(http.StatusOK, recorder.Code, "Dictionary search should respond with 200 OK")

	// Verify the response contains valid JSON
	var response models.DictionaryResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	s.NoError(err, "Response should be valid JSON")

	// Verify the response structure contains expected data
	s.NotEmpty(response.Phonetics, "Response should contain phonetics")
	s.NotEmpty(response.Meanings, "Response should contain meanings")

	// Verify phonetics data
	s.Equal("en", response.Phonetics[0].Language, "First phonetic should have language 'en'")
	s.Contains(response.Phonetics[0].Audio, "hello.mp3", "Audio URL should contain 'hello.mp3'")

	// Verify meanings data
	s.Equal("noun", response.Meanings[0].PartOfSpeech, "First meaning should be part of speech 'noun'")
	s.NotEmpty(response.Meanings[0].Definitions, "Meaning should contain definitions")
	s.Contains(response.Meanings[0].Definitions[0].Definition, "問候", "Definition should contain Chinese translation")

	// Verify content type header
	s.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}

// TestSearchWordEmptyParameter tests that SearchWord handles empty word parameter correctly
func (s *dictionaryControllerTestSuite) TestSearchWordEmptyParameter() {
	// Create a test request with empty word parameter
	req := httptest.NewRequest("GET", "/api/dictionary/", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	s.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 404 Not Found (gin route doesn't match)
	s.Equal(http.StatusNotFound, recorder.Code, "Empty word parameter should result in 404 Not Found")
}

// TestSearchWordNotFound tests that SearchWord handles word not found scenarios
func (s *dictionaryControllerTestSuite) TestSearchWordNotFound() {
	// Create a test request for a word that doesn't exist in mock server
	req := httptest.NewRequest("GET", "/api/dictionary/nonexistentword", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	s.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 500 Internal Server Error
	s.Equal(http.StatusInternalServerError, recorder.Code, "Word not found should respond with 500")

	// Verify error response format
	var response gin.H
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	s.NoError(err, "Error response should be valid JSON")
	s.Contains(response["error"], "Error fetching word data", "Error message should contain 'Error fetching word data'")
}