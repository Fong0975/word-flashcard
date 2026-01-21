package api

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/suite"
)

// dictionaryTestSuite contains all dictionary-related tests
type dictionaryTestSuite struct {
	suite.Suite
	mockCambridgeServer *httptest.Server
	originalPort        string
}

// TestDictionaryService runs all dictionary tests using the test suite
func TestDictionaryService(t *testing.T) {
	suite.Run(t, new(dictionaryTestSuite))
}

// SetupTest is called before each test method
func (s *dictionaryTestSuite) SetupTest() {
	setupDictionaryTestLogging()

	// Clear cache before each test
	cacheMutex.Lock()
	cache = make(map[string]CacheEntry)
	cacheMutex.Unlock()

	// Store original port and setup mock server
	s.originalPort = os.Getenv("CAMBRIDGE_API_PORT")
	s.setupMockCambridgeServer()
}

// TearDownTest is called after each test method
func (s *dictionaryTestSuite) TearDownTest() {
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

// setupDictionaryTestLogging configures logging for dictionary tests
func setupDictionaryTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// setupMockCambridgeServer creates a mock server that simulates Cambridge API responses
func (s *dictionaryTestSuite) setupMockCambridgeServer() {
	s.mockCambridgeServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock Cambridge API response for successful word lookup
		if strings.Contains(r.URL.Path, "/api/dictionary/en-tw/hello") {
			mockResponse := CambridgeResponse{
				Word: "hello",
				POS:  []string{"noun", "verb"},
				Pronunciation: []CambridgePronunciation{
					{
						POS:  "noun",
						Lang: "en",
						URL:  "http://example.com/audio/hello.mp3",
						Pron: "/həˈloʊ/",
					},
				},
				Definition: []CambridgeDefinition{
					{
						ID:          1,
						POS:         "noun",
						Text:        "a greeting",
						Translation: "問候",
						Example: []CambridgeExample{
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

// TestDictionarySearchSuccess tests that dictionarySearch successfully handles a valid word request
func (s *dictionaryTestSuite) TestDictionarySearchSuccess() {
	// Create a new ServeMux for testing
	mux := http.NewServeMux()

	// Create a DictionaryHandler instance
	dictionaryHandler := &DictionaryHandler{}

	// Register the dictionary handler
	dictionaryHandler.Register(mux)

	// Create a test request to search for the word "hello"
	req := httptest.NewRequest("GET", "/api/dictionary/hello", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the mux
	mux.ServeHTTP(recorder, req)

	// Verify the response status code is 200 OK
	s.Equal(http.StatusOK, recorder.Code, "Dictionary search should respond with 200 OK")

	// Verify the response contains valid JSON
	var response DictionaryResponse
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
}