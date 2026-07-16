package common

import (
	"errors"
	"net/http"

	"word-flashcard/internal/models"
	"word-flashcard/utils/database"

	"github.com/gin-gonic/gin"
)

// DetailedError pairs a client-safe message with extra key/value context that
// is only ever meant for the logs, never the HTTP response body. Use
// NewFieldError to construct one; ResponseError automatically surfaces
// LogDetail() when the error reaches it.
type DetailedError struct {
	public string
	args   []any
}

func (e *DetailedError) Error() string { return e.public }

// LogDetail returns the extra context as slog-style alternating key/value
// pairs, meant for logs only.
func (e *DetailedError) LogDetail() []any { return e.args }

// NewFieldError builds a field-validation error whose message (public) is
// safe to return to the client as-is, while args (slog-style key/value
// pairs, e.g. "length", 134, "max", 100) carries the concrete reason for the
// failure for diagnostics only.
func NewFieldError(public string, args ...any) error {
	return &DetailedError{public: public, args: args}
}

// ValidationError marks an error as a field-level validation failure, as opposed
// to a request-body parsing failure. Validators in the controllers package only
// ever describe the shape of the caller's own input (e.g. "familiarity is invalid"),
// so unlike most internal errors, its message is safe to return to the client.
type ValidationError struct {
	err error
}

func (v *ValidationError) Error() string { return v.err.Error() }
func (v *ValidationError) Unwrap() error { return v.err }

// NewValidationError wraps a field-validation error so RespondInvalidBody can
// recognize it and surface its message instead of a generic one.
func NewValidationError(err error) error {
	if err == nil {
		return nil
	}
	return &ValidationError{err: err}
}

// RespondInvalidBody sends a 400 response for a request-body failure. If err
// was produced by a field validator (see NewValidationError), its message is
// safe to show as-is and the response is tagged validation_error; otherwise
// (e.g. malformed JSON) a generic message is used, tagged invalid_request.
func RespondInvalidBody(err error, c *gin.Context) {
	var vErr *ValidationError
	if errors.As(err, &vErr) {
		ResponseError(http.StatusBadRequest, vErr.Error(), models.ErrCodeValidationError, err, c)
		return
	}
	ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
}

// RespondDatabaseWriteError sends the appropriate error response for a failed
// insert/update. If err is a UNIQUE constraint violation, it's safe to tell the
// client exactly what happened (409, conflictMessage); any other failure stays
// generic (500, message, internal_error) since it may reflect internal detail.
func RespondDatabaseWriteError(message string, conflictMessage string, err error, c *gin.Context) {
	if database.IsDuplicateEntryError(err) {
		ResponseError(http.StatusConflict, conflictMessage, models.ErrCodeConflict, err, c)
		return
	}
	ResponseError(http.StatusInternalServerError, message, models.ErrCodeInternalError, err, c)
}
