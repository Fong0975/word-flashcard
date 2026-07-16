package common

import (
	"errors"
	"net/http"
	"testing"

	"github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/suite"
)

// ErrorsTestSuite is a test suite for the field-error/validation-error types
// and the response helpers that dispatch on them.
type ErrorsTestSuite struct {
	suite.Suite
}

// TestErrorsTestSuite runs the ErrorsTestSuite
func TestErrorsTestSuite(t *testing.T) {
	suite.Run(t, new(ErrorsTestSuite))
}

// TestNewFieldError tests that NewFieldError produces a *DetailedError whose
// Error() returns the public message and whose LogDetail() returns the
// diagnostic key/value pairs unchanged.
func (suite *ErrorsTestSuite) TestNewFieldError() {
	err := NewFieldError("reminder is invalid", "length", 134, "max", 100)

	suite.EqualError(err, "reminder is invalid")

	var de *DetailedError
	suite.Require().True(errors.As(err, &de))
	suite.Equal([]any{"length", 134, "max", 100}, de.LogDetail())
}

// TestNewValidationError tests that a nil error passes through unchanged and
// that a non-nil error is wrapped so both Error() and Unwrap() behave correctly.
func (suite *ErrorsTestSuite) TestNewValidationError() {
	suite.Run("nil error passes through", func() {
		suite.Nil(NewValidationError(nil))
	})

	suite.Run("wraps a non-nil error", func() {
		inner := errors.New("familiarity is invalid")
		err := NewValidationError(inner)

		suite.EqualError(err, "familiarity is invalid")
		suite.Equal(inner, errors.Unwrap(err))
	})
}

// TestRespondInvalidBody tests that a ValidationError surfaces its own
// message as a validation_error, while any other error falls back to the
// generic invalid_request message.
func (suite *ErrorsTestSuite) TestRespondInvalidBody() {
	testCases := []struct {
		name     string
		err      error
		wantBody string
	}{
		{
			name:     "validation error surfaces its own message",
			err:      NewValidationError(errors.New("familiarity is invalid")),
			wantBody: `{"error":"familiarity is invalid","code":"validation_error"}`,
		},
		{
			name:     "non-validation error uses generic message",
			err:      errors.New("unexpected EOF"),
			wantBody: `{"error":"Invalid request body","code":"invalid_request"}`,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx, w := newResponseTestContext()

			RespondInvalidBody(tc.err, ctx)

			suite.Equal(http.StatusBadRequest, w.Code)
			suite.JSONEq(tc.wantBody, w.Body.String())
		})
	}
}

// TestRespondDatabaseWriteError tests that a UNIQUE-constraint violation
// (modeled here via a MySQL duplicate-entry error) yields a 409 conflict
// response, while any other database error falls back to a generic 500.
func (suite *ErrorsTestSuite) TestRespondDatabaseWriteError() {
	testCases := []struct {
		name           string
		err            error
		wantStatusCode int
		wantBody       string
	}{
		{
			name:           "duplicate entry yields 409 conflict",
			err:            &mysql.MySQLError{Number: 1062, Message: "Duplicate entry"},
			wantStatusCode: http.StatusConflict,
			wantBody:       `{"error":"word already exists","code":"conflict"}`,
		},
		{
			name:           "other database error yields 500 internal error",
			err:            errors.New("connection refused"),
			wantStatusCode: http.StatusInternalServerError,
			wantBody:       `{"error":"failed to insert word","code":"internal_error"}`,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx, w := newResponseTestContext()

			RespondDatabaseWriteError("failed to insert word", "word already exists", tc.err, ctx)

			suite.Equal(tc.wantStatusCode, w.Code)
			suite.JSONEq(tc.wantBody, w.Body.String())
		})
	}
}
