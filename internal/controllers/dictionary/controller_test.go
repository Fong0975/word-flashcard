package dictionary

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite contains all dictionary controller tests
type ControllerTestSuite struct {
	suite.Suite
	controller          *Controller
	router              *gin.Engine
	mockCambridgeServer *httptest.Server
	originalPort        string
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest is called before each test method
func (suite *ControllerTestSuite) SetupTest() {
	setupTestLogging()

	// Set gin to test mode
	gin.SetMode(gin.TestMode)

	// Clear cache before each test
	suite.controller = New()

	// Initialize router
	suite.router = gin.New()

	// Register dictionary route
	suite.router.GET("/api/dictionary/:word", suite.controller.SearchWord)

	// Store original port and setup mock server
	suite.originalPort = os.Getenv("CAMBRIDGE_API_PORT")
	suite.setupMockCambridgeServer()
}

// TearDownTest is called after each test method
func (suite *ControllerTestSuite) TearDownTest() {
	if suite.mockCambridgeServer != nil {
		suite.mockCambridgeServer.Close()
	}
	// Restore original environment variable
	if suite.originalPort != "" {
		os.Setenv("CAMBRIDGE_API_PORT", suite.originalPort)
	} else {
		os.Unsetenv("CAMBRIDGE_API_PORT")
	}
}

// setupTestLogging configures logging for dictionary controller tests
func setupTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// setupMockCambridgeServer creates a mock server that simulates Cambridge API responses
func (suite *ControllerTestSuite) setupMockCambridgeServer() {
	suite.mockCambridgeServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	serverURL := suite.mockCambridgeServer.URL
	// Extract port from URL like "http://127.0.0.1:12345"
	port := serverURL[len("http://127.0.0.1:"):]
	os.Setenv("CAMBRIDGE_API_PORT", port)
}
