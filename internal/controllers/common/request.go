package common

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// ParseIDFromPath extracts and validates ID parameter from URL path
func ParseIDFromPath(c *gin.Context, paramName string) (int, error) {
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

// ParseLimitAndOffsetFromPath extracts and validates limit and offset parameter from URL path
func ParseLimitAndOffsetFromPath(c *gin.Context) (int, int, error) {
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
