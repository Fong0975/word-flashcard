package controllers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"strconv"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin/binding"

	"github.com/Masterminds/squirrel"
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

// ConvertFilterToSqlizer converts a SearchFilter to squirrel.Sqlizer with validation and transformation logic.
// Supports operations:
//   - 'equal'/'eq': Single value matching, e.g., value: "high"
//   - 'not_equal'/'ne'/'neq': Single value exclusion, e.g., value: "low"
//   - 'in': Multiple value matching, e.g., value: "[\"yellow\", \"green\"]"
//   - 'not_in'/'nin': Multiple value exclusion, e.g., value: "[\"yellow\", \"green\"]"
//   - 'like': Pattern matching with SQL LIKE operator, e.g., value: "%pattern%"
//   - 'not_like'/'nlike': Pattern exclusion with SQL NOT LIKE operator, e.g., value: "%pattern%"
func ConvertFilterToSqlizer(filter *models.SearchFilter) (squirrel.Sqlizer, error) {
	if filter == nil {
		return nil, nil
	}

	// Validate required fields
	if filter.Key == "" {
		return nil, errors.New("filter key cannot be empty")
	}
	if filter.Operator == "" {
		return nil, errors.New("filter operator cannot be empty")
	}

	switch filter.Operator {
	case "equal", "eq":
		// Equal operation: column = value
		if filter.Value == "" {
			return nil, errors.New("filter value cannot be empty for equal operation")
		}
		return squirrel.Eq{filter.Key: filter.Value}, nil

	case "not_equal", "ne", "neq":
		// Not equal operation: column != value
		if filter.Value == "" {
			return nil, errors.New("filter value cannot be empty for not_equal operation")
		}
		return squirrel.NotEq{filter.Key: filter.Value}, nil

	case "in":
		// In operation: column IN (value1, value2, ...)
		// Value should be a JSON array string
		return parseArrayFilter(filter.Key, filter.Value, false)

	case "not_in", "nin":
		// Not in operation: column NOT IN (value1, value2, ...)
		// Value should be a JSON array string
		return parseArrayFilter(filter.Key, filter.Value, true)

	case "like":
		// Like operation: column LIKE pattern
		if filter.Value == "" {
			return nil, errors.New("filter value cannot be empty for like operation")
		}
		return squirrel.Like{filter.Key: filter.Value}, nil

	case "not_like", "nlike":
		// Not like operation: column NOT LIKE pattern
		if filter.Value == "" {
			return nil, errors.New("filter value cannot be empty for not_like operation")
		}
		return squirrel.NotLike{filter.Key: filter.Value}, nil

	default:
		return nil, errors.New("unsupported operator: " + filter.Operator + ". Supported operators: equal/eq, not_equal/ne/neq, in, not_in/nin, like, not_like/nlike")
	}
}

// parseArrayFilter parses the filter value as JSON array and creates appropriate squirrel condition
func parseArrayFilter(key, value string, isNotIn bool) (squirrel.Sqlizer, error) {
	if value == "" {
		return nil, errors.New("filter value cannot be empty for array operations")
	}

	// Parse JSON array
	var values []interface{}
	if err := json.Unmarshal([]byte(value), &values); err != nil {
		return nil, errors.New("filter value must be a valid JSON array for array operations: " + err.Error())
	}

	// Validate array is not empty
	if len(values) == 0 {
		return nil, errors.New("filter value array cannot be empty for array operations")
	}

	// Create appropriate condition
	if isNotIn {
		return squirrel.NotEq{key: values}, nil
	}
	return squirrel.Eq{key: values}, nil
}
