package controllers

import (
	"bytes"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// CommonHelperTestSuite is a test suite for shared controller helper functions
type CommonHelperTestSuite struct {
	suite.Suite
	logBuffer *bytes.Buffer
}

// TestCommonHelperTestSuite runs the CommonHelperTestSuite
func TestCommonHelperTestSuite(t *testing.T) {
	suite.Run(t, new(CommonHelperTestSuite))
}

// SetupTest sets up a buffered Debug-level logger before each test so log
// output can be inspected
func (suite *CommonHelperTestSuite) SetupTest() {
	suite.logBuffer = &bytes.Buffer{}
	handler := slog.NewTextHandler(suite.logBuffer, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slog.SetDefault(slog.New(handler))
}

// TestLogRandomSelectionResult tests that logRandomSelectionResult logs at
// Debug when actual matches expected, and escalates to Warn on any mismatch
func (suite *CommonHelperTestSuite) TestLogRandomSelectionResult() {
	type testCase struct {
		name        string
		expected    int
		actual      int
		wantLevel   string
		unwantLevel string
	}

	testCases := []testCase{
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

			logRandomSelectionResult("Random question bucket fetched.", tc.expected, tc.actual, "bucket", "unpractised")

			logOutput := suite.logBuffer.String()
			suite.Contains(logOutput, tc.wantLevel)
			suite.NotContains(logOutput, tc.unwantLevel)
			suite.Contains(logOutput, "Random question bucket fetched.")
			suite.Contains(logOutput, "bucket=unpractised")
		})
	}
}

// newTestContext builds a gin.Context backed by a real *http.Request so
// ResponseError's use of c.Request.RequestURI does not panic.
func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words", nil)
	return ctx, w
}

// TestResponseError_DetailPropagation verifies that ResponseError appends a
// *detailedError's key/value pairs to the log line -- whether it reaches
// ResponseError directly or wrapped inside a validationError (the shape
// produced by the real parseAndValidateWordRequest chain) -- while leaving a
// plain error's logging unchanged and never leaking detail into the response
// body.
func (suite *CommonHelperTestSuite) TestResponseError_DetailPropagation() {
	type testCase struct {
		name               string
		err                error
		wantLogContains    []string
		wantLogNotContains []string
	}

	testCases := []testCase{
		{
			name:               "plain error has no detail in log",
			err:                errors.New("reminder is invalid"),
			wantLogNotContains: []string{"length=", "max="},
		},
		{
			name:            "detailedError appends log detail",
			err:             newFieldError("reminder is invalid", "length", 134, "max", 100),
			wantLogContains: []string{"length=134", "max=100"},
		},
		{
			name:            "detailedError wrapped in validationError still appends detail",
			err:             newValidationError(newFieldError("reminder is invalid", "length", 134, "max", 100)),
			wantLogContains: []string{"length=134", "max=100"},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.logBuffer.Reset()
			ctx, w := newTestContext()

			ResponseError(http.StatusBadRequest, "reminder is invalid", models.ErrCodeValidationError, tc.err, ctx)

			assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
			assert.JSONEq(suite.T(), `{"error":"reminder is invalid","code":"validation_error"}`, w.Body.String())
			assert.NotContains(suite.T(), w.Body.String(), "134")

			logOutput := suite.logBuffer.String()
			suite.Contains(logOutput, "message=\"reminder is invalid\"")
			for _, want := range tc.wantLogContains {
				suite.Contains(logOutput, want)
			}
			for _, notWant := range tc.wantLogNotContains {
				suite.NotContains(logOutput, notWant)
			}
		})
	}
}
