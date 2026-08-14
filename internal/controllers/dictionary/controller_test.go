package dictionary

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite contains all dictionary controller tests
type ControllerTestSuite struct {
	suite.Suite
	controller          *Controller
	router              *gin.Engine
	mockCambridgeServer *httptest.Server
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
	suite.router.GET("/api/dictionary/:language/:word", suite.controller.SearchWord)

	suite.setupMockCambridgeServer()
}

// TearDownTest is called after each test method
func (suite *ControllerTestSuite) TearDownTest() {
	if suite.mockCambridgeServer != nil {
		suite.mockCambridgeServer.Close()
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

// setupMockCambridgeServer creates a mock server that simulates Cambridge Dictionary
// pages and points the controller's cambridgeBaseURL at it, replacing the real
// dictionary.cambridge.org origin for the duration of the test.
func (suite *ControllerTestSuite) setupMockCambridgeServer() {
	suite.mockCambridgeServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/us/dictionary/english-chinese-traditional/hello":
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(helloFixtureHTML))
		case "/us/dictionary/english-chinese-traditional/upstreamerror":
			w.WriteHeader(http.StatusInternalServerError)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	suite.controller.cambridgeBaseURL = suite.mockCambridgeServer.URL
}
