package logs

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite is a test suite for the logs Controller.
//
// The controller has no peers to mock: each test instead points
// LOG_FILE_PATH at a temporary directory, so the handlers read a log set
// the test controls.
type ControllerTestSuite struct {
	suite.Suite
	controller *Controller
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	gin.SetMode(gin.TestMode)
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *ControllerTestSuite) SetupTest() {
	suite.controller = New()
}

// useFixtureLogs writes the standard fixture -- entries D(WARN) C(INFO)
// B(ERROR) A(INFO), newest first, split across a current and a rotated
// file -- and points LOG_FILE_PATH at it. It returns the directory so
// callers can reach the state file too.
func (suite *ControllerTestSuite) useFixtureLogs() string {
	dir := suite.T().TempDir()
	files := map[string]string{
		"app.log": "2026/08/30 20:44:12 | INFO | c.go:3 | C\n" +
			"2026/08/30 20:44:13 | WARN | d.go:4 | D\n",
		"app-2026-08-30T10-00-00.000.log": "2026/08/30 20:44:10 | INFO | a.go:1 | A\n" +
			"2026/08/30 20:44:11 | ERROR | b.go:2 | B\n",
	}
	for name, content := range files {
		suite.Require().NoError(os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644))
	}

	suite.T().Setenv("LOG_FILE_PATH", filepath.Join(dir, "app.log"))
	suite.T().Setenv("LOG_STATE_FILE_PATH", filepath.Join(dir, "state.json"))

	return dir
}
