package dictionary

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite contains all dictionary controller tests
type ControllerTestSuite struct {
	suite.Suite
	controller       *Controller
	router           *gin.Engine
	mockGeminiServer *httptest.Server
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

	// New() reads GEMINI_API_KEY from the environment; set a placeholder so
	// tests exercise the configured path rather than the "not configured" guard.
	suite.Require().NoError(os.Setenv("GEMINI_API_KEY", "test-api-key"))

	// Clear cache before each test
	suite.controller = New()

	// Initialize router
	suite.router = gin.New()

	// Register dictionary route
	suite.router.GET("/api/dictionary/:language/:word", suite.controller.SearchWord)

	suite.setupMockGeminiServer()
}

// TearDownTest is called after each test method
func (suite *ControllerTestSuite) TearDownTest() {
	if suite.mockGeminiServer != nil {
		suite.mockGeminiServer.Close()
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

// helloGeminiPayloadJSON is the dictionary payload Gemini would return for
// "hello", covering the fields fetchWordDataFromGemini and its helpers map:
// two parts of speech and two definitions, one with an example and
// translation, one without an example.
const helloGeminiPayloadJSON = `{
	"found": true,
	"word": "hello",
	"pos": ["exclamation", "noun"],
	"definitions": [
		{
			"pos": "exclamation",
			"text": "used when meeting or greeting someone",
			"translation": "喂，你好",
			"examples": [{"text": "Hello, Paul.", "translation": "你好，保羅。"}]
		},
		{
			"pos": "noun",
			"text": "something that is said to attract someone's attention",
			"translation": "（引起別人注意的招呼語）",
			"examples": []
		}
	]
}`

// notFoundGeminiPayloadJSON is the payload Gemini returns when the requested
// word is not a real English word.
const notFoundGeminiPayloadJSON = `{"found": false, "word": "", "pos": [], "definitions": []}`

// setupMockGeminiServer creates a mock server that simulates the Gemini
// generateContent API and points the controller's geminiBaseURL at it,
// replacing the real generativelanguage.googleapis.com origin for the
// duration of the test. Since Gemini's URL doesn't carry the word being
// looked up, the mock inspects the request body's prompt text instead.
func (suite *ControllerTestSuite) setupMockGeminiServer() {
	suite.mockGeminiServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		suite.Equal("test-api-key", r.Header.Get("x-goog-api-key"), "request should authenticate via the x-goog-api-key header")
		suite.Empty(r.URL.RawQuery, "the API key must never be sent as a URL query parameter")

		body, err := io.ReadAll(r.Body)
		suite.Require().NoError(err)
		prompt := string(body)

		switch {
		case strings.Contains(prompt, "upstreamerror"):
			w.WriteHeader(http.StatusInternalServerError)
		case strings.Contains(prompt, "hello"):
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(geminiEnvelopeJSON(helloGeminiPayloadJSON))
		default:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(geminiEnvelopeJSON(notFoundGeminiPayloadJSON))
		}
	}))

	suite.controller.geminiBaseURL = suite.mockGeminiServer.URL
}
