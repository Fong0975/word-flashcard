package common

import (
	"encoding/json"
	"errors"
	"log/slog"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ResponseSuccess sends a success response and logs the details.
func ResponseSuccess(statusCode int, data any, c *gin.Context) {
	// Set the response & log the success
	if data == nil {
		// For 204 No Content, remove the JSON content-type header and use c.Data
		if statusCode == 204 {
			c.Header("Content-Type", "")
			c.Data(statusCode, "", nil)
		} else {
			c.Status(statusCode)
		}
		slog.Debug("API success response.", "path", c.Request.RequestURI, "status", statusCode, "data", "null")
	} else {
		c.JSON(statusCode, data)

		// Convert data to JSON for logging
		var dataJSON string
		if jsonBytes, err := json.Marshal(data); err != nil {
			dataJSON = "error marshaling to JSON: " + err.Error()
		} else {
			dataJSON = string(jsonBytes)
		}

		slog.Debug("API success response.", "path", c.Request.RequestURI, "status", statusCode, "data", dataJSON)
	}
}

// ResponseError sends an error response and logs the error details.
// message is safe to show to the client; err (the underlying cause, which may
// contain internal detail) is only ever written to the log, never to the response body.
// If err carries a *DetailedError anywhere in its chain, its key/value pairs
// are appended to the log line so the client-safe message can stay generic
// while the log captures the concrete reason.
func ResponseError(statusCode int, message string, code models.ErrorCode, err error, c *gin.Context) {
	// Set the response
	c.JSON(statusCode, models.ErrorResponse{Error: message, Code: code})

	// Log the error, enriched with any internal-only detail attached to err
	logArgs := []any{"path", c.Request.RequestURI, "status", statusCode, "message", message, "code", code, "error", err}
	var de *DetailedError
	if errors.As(err, &de) {
		logArgs = append(logArgs, de.LogDetail()...)
	}
	slog.Error("API error response.", logArgs...)
}
