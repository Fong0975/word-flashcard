package log

import (
	"log/slog"
	"testing"

	"github.com/stretchr/testify/suite"
)

// LevelTestSuite contains all LevelForStatus related tests
type LevelTestSuite struct {
	suite.Suite
}

// TestLevelTestSuite runs all LevelForStatus tests using the test suite
func TestLevelTestSuite(t *testing.T) {
	suite.Run(t, new(LevelTestSuite))
}

// TestLevelForStatus tests the LevelForStatus status-code-to-level mapping
func (ls *LevelTestSuite) TestLevelForStatus() {
	testCases := []struct {
		name       string
		statusCode int
		expected   slog.Level
	}{
		{name: "2xx success maps to info", statusCode: 200, expected: slog.LevelInfo},
		{name: "3xx redirect maps to info", statusCode: 302, expected: slog.LevelInfo},
		{name: "boundary below 400 maps to info", statusCode: 399, expected: slog.LevelInfo},
		{name: "boundary 400 maps to warn", statusCode: 400, expected: slog.LevelWarn},
		{name: "4xx client error maps to warn", statusCode: 404, expected: slog.LevelWarn},
		{name: "boundary 499 maps to warn", statusCode: 499, expected: slog.LevelWarn},
		{name: "boundary 500 maps to error", statusCode: 500, expected: slog.LevelError},
		{name: "5xx server error maps to error", statusCode: 503, expected: slog.LevelError},
	}

	for _, tc := range testCases {
		ls.Run(tc.name, func() {
			ls.Equal(tc.expected, LevelForStatus(tc.statusCode))
		})
	}
}
