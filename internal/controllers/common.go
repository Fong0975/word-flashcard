package controllers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"strconv"

	"github.com/gin-gonic/gin/binding"

	"github.com/gin-gonic/gin"
)

// parseIDFromPath extracts and validates ID parameter from URL path
func parseIDFromPath(c *gin.Context, paramName string) (int, error) {
	idStr := c.Param(paramName)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Error("Invalid ID format", "param", paramName, "value", idStr, "error", err)
		return 0, errors.New("invalid ID format")
	}
	if id <= 0 {
		slog.Error("ID must be positive", "id", id)
		return 0, errors.New("ID must be positive")
	}
	return id, nil
}

// parseLimitAndOffsetFromPath extracts and validates limit and offset parameter from URL path
func parseLimitAndOffsetFromPath(c *gin.Context) (int, int, error) {
	// Get 'limit' parameter
	limit, err := ParseIntQueryParam(c, "limit", 100)
	if err != nil {
		slog.Error("Invalid limit parameter", "error", err)
		return 0, 0, errors.New("invalid limit parameter")
	} else if limit < 0 || limit > 1000 {
		slog.Error("Limit must be between 1 and 1000", "limit", limit)
		return 0, 0, errors.New("invalid limit parameter")
	}

	// Get 'offset' parameter
	offset, err := ParseIntQueryParam(c, "offset", 0)
	if err != nil {
		slog.Error("Invalid offset parameter", "error", err)
		return 0, 0, errors.New("invalid offset parameter")
	}
	if offset < 0 {
		slog.Error("Offset must be non-negative", "offset", offset)
		return 0, 0, errors.New("invalid offset parameter")
	}

	return limit, offset, nil
}

// ParseIntQueryParam extracts and validates an integer query parameter, returning a default value if not present.
func ParseIntQueryParam(c *gin.Context, paramName string, defaultValue int) (int, error) {
	paramStr := c.Query(paramName)
	if paramStr == "" {
		return defaultValue, nil
	}
	paramInt, err := strconv.Atoi(paramStr)
	if err != nil {
		slog.Error("Invalid query parameter format", "param", paramName, "value", paramStr, "error", err)
		return 0, errors.New("invalid query parameter format for " + paramName)
	}
	return paramInt, nil
}

// ParseRequestBody parses the JSON request body into the provided object and logs the details.
func ParseRequestBody(obj any, c *gin.Context) error {
	// Check if the request body is empty
	if c.Request.ContentLength == 0 {
		slog.Debug("Empty request body")
		return nil
	}

	// Cache request body
	var checkMap map[string]any
	if err := c.ShouldBindBodyWith(&checkMap, binding.JSON); err != nil {
		// If body is empty or blank only
		if errors.Is(err, io.EOF) {
			slog.Debug("Empty request body (EOF)")
			return nil
		}
		return err
	}

	// If the body is empty (e.g., "{}"), return early without trying to bind to obj
	if len(checkMap) == 0 {
		slog.Debug("Received body parsing", "body", "{}")
		return nil
	}

	// Bind the body to the provided object
	if err := c.ShouldBindBodyWith(obj, binding.JSON); err != nil {
		return err
	}

	// Parsing to JSON for logging
	jsonData, err := json.Marshal(obj)
	if err != nil {
		slog.Warn("Received body parsing. Error marshalling json", "error", err)
	} else {
		slog.Debug("Received body parsing", "body", string(jsonData))
	}

	return nil
}

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
func ResponseError(statusCode int, message string, err error, c *gin.Context) {
	// Set the response
	c.JSON(statusCode, gin.H{"error": message})
	// Log the error
	slog.Error("API error response.", "path", c.Request.RequestURI, "status", statusCode, "message", message, "error", err)
}
