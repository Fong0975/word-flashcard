package health

import (
	"io"
	"log/slog"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite contains all health controller tests
type ControllerTestSuite struct {
	suite.Suite
	controller *Controller
	router     *gin.Engine
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

	// Initialize controller and router
	suite.controller = New()
	suite.router = gin.New()

	// Register health routes
	suite.router.GET("/api/health", suite.controller.HealthCheck)
	suite.router.GET("/api/information", suite.controller.InformationCheck)
}

// setupTestLogging configures logging for health controller tests
func setupTestLogging() {
	handler := slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)
}
