package common

import (
	"bytes"
	"log/slog"
	"testing"

	"github.com/stretchr/testify/suite"
)

// RandomSelectionTestSuite is a test suite for random-selection logging helpers
type RandomSelectionTestSuite struct {
	suite.Suite
	logBuffer *bytes.Buffer
}

// TestRandomSelectionTestSuite runs the RandomSelectionTestSuite
func TestRandomSelectionTestSuite(t *testing.T) {
	suite.Run(t, new(RandomSelectionTestSuite))
}

// SetupTest sets up a buffered Debug-level logger before each test so log
// output can be inspected
func (suite *RandomSelectionTestSuite) SetupTest() {
	suite.logBuffer = &bytes.Buffer{}
	handler := slog.NewTextHandler(suite.logBuffer, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slog.SetDefault(slog.New(handler))
}

// TestLogRandomSelectionResult tests that LogRandomSelectionResult logs at
// Debug when actual matches expected, and escalates to Warn on any mismatch
func (suite *RandomSelectionTestSuite) TestLogRandomSelectionResult() {
	testCases := []struct {
		name        string
		expected    int
		actual      int
		wantLevel   string
		unwantLevel string
	}{
		{
			name:        "matching count logs at Debug level",
			expected:    5,
			actual:      5,
			wantLevel:   "level=DEBUG",
			unwantLevel: "level=WARN",
		},
		{
			name:        "shortfall logs at Warn level",
			expected:    5,
			actual:      3,
			wantLevel:   "level=WARN",
			unwantLevel: "level=DEBUG",
		},
		{
			name:        "surplus also logs at Warn level",
			expected:    3,
			actual:      5,
			wantLevel:   "level=WARN",
			unwantLevel: "level=DEBUG",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.logBuffer.Reset()

			LogRandomSelectionResult("Random question bucket fetched.", tc.expected, tc.actual, "bucket", "unpractised")

			logOutput := suite.logBuffer.String()
			suite.Contains(logOutput, tc.wantLevel)
			suite.NotContains(logOutput, tc.unwantLevel)
			suite.Contains(logOutput, "Random question bucket fetched.")
			suite.Contains(logOutput, "bucket=unpractised")
		})
	}
}
