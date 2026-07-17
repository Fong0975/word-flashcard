package common

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

// ResponseHelperTestSuite is a test suite for HTTP response helper functions
type ResponseHelperTestSuite struct {
	suite.Suite
	logBuffer *bytes.Buffer
}

// TestResponseHelperTestSuite runs the ResponseHelperTestSuite
func TestResponseHelperTestSuite(t *testing.T) {
	suite.Run(t, new(ResponseHelperTestSuite))
}

// SetupTest sets up a buffered Debug-level logger before each test so log
// output can be inspected
func (suite *ResponseHelperTestSuite) SetupTest() {
	suite.logBuffer = &bytes.Buffer{}
	handler := slog.NewTextHandler(suite.logBuffer, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slog.SetDefault(slog.New(handler))
}

// newResponseTestContext builds a gin.Context backed by a real *http.Request so
// ResponseError/ResponseSuccess's use of c.Request.RequestURI does not panic.
func newResponseTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words", nil)
	return ctx, w
}

// TestResponseSuccess tests ResponseSuccess across a 200 with a JSON body, a
// 204 No Content with nil data (which must clear the Content-Type header),
// and a non-204 status with nil data.
func (suite *ResponseHelperTestSuite) TestResponseSuccess() {
	testCases := []struct {
		name              string
		statusCode        int
		data              any
		wantBody          string
		wantNoBody        bool
		wantNoContentType bool
	}{
		{
			name:       "200 with JSON body",
			statusCode: http.StatusOK,
			data:       gin.H{"count": 3},
			wantBody:   `{"count":3}`,
		},
		{
			name:              "204 No Content clears content-type",
			statusCode:        204,
			data:              nil,
			wantNoBody:        true,
			wantNoContentType: true,
		},
		{
			name:       "non-204 status with nil data sets status only",
			statusCode: http.StatusNotFound,
			data:       nil,
			wantNoBody: true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx, w := newResponseTestContext()

			ResponseSuccess(tc.statusCode, tc.data, ctx)

			// gin defers flushing the status code to the underlying ResponseWriter
			// until something writes a body, so check the pending status via
			// ctx.Writer.Status() rather than w.Code (which stays at the zero
			// value until flushed).
			suite.Equal(tc.statusCode, ctx.Writer.Status())
			if tc.wantNoBody {
				suite.Empty(w.Body.String())
			} else {
				suite.JSONEq(tc.wantBody, w.Body.String())
			}
			if tc.wantNoContentType {
				suite.Empty(w.Header().Get("Content-Type"))
			}
		})
	}
}

// TestResponseError_DetailPropagation verifies that ResponseError appends a
// *DetailedError's key/value pairs to the log line -- whether it reaches
// ResponseError directly or wrapped inside a ValidationError (the shape
// produced by the real parseAndValidateWordRequest chain) -- while leaving a
// plain error's logging unchanged and never leaking detail into the response
// body.
func (suite *ResponseHelperTestSuite) TestResponseError_DetailPropagation() {
	testCases := []struct {
		name               string
		err                error
		wantLogContains    []string
		wantLogNotContains []string
	}{
		{
			name:               "plain error has no detail in log",
			err:                errors.New("reminder is invalid"),
			wantLogNotContains: []string{"length=", "max="},
		},
		{
			name:            "DetailedError appends log detail",
			err:             NewFieldError("reminder is invalid", "length", 134, "max", 100),
			wantLogContains: []string{"length=134", "max=100"},
		},
		{
			name:            "DetailedError wrapped in ValidationError still appends detail",
			err:             NewValidationError(NewFieldError("reminder is invalid", "length", 134, "max", 100)),
			wantLogContains: []string{"length=134", "max=100"},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.logBuffer.Reset()
			ctx, w := newResponseTestContext()

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
