package controllers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"strconv"

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

// ParseRequestBody parses the JSON request body into the provided object and logs the details.
func ParseRequestBody(obj any, c *gin.Context) error {
	// Get the request object form the body
	if err := c.ShouldBindJSON(obj); err != nil {
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
