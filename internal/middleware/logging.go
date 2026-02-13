package middleware

import (
	"context"
	"log/slog"
	"regexp"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware returns a gin middleware that logs HTTP requests
// This middleware will log all requests including 404 errors
func LoggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Build request path with query parameters
		requestPath := param.Path
		if param.Request.URL.RawQuery != "" {
			requestPath += "?" + param.Request.URL.RawQuery
		}

		// Skip local successful requests to /api/health
		if requestPath == "/api/health" && param.StatusCode == 200 && param.ClientIP == "::1" {
			return ""
		}

		debugRegex := regexp.MustCompile(`^(/static.*|/swagger/.*\.\w+[^html])$`)
		// Choose log level based on request path and status code
		logLevel := slog.LevelInfo
		if param.StatusCode >= 400 && param.StatusCode < 500 {
			logLevel = slog.LevelWarn // 4xx errors including 404
		} else if param.StatusCode >= 500 {
			logLevel = slog.LevelError // 5xx errors
		} else if debugRegex.MatchString(requestPath) {
			logLevel = slog.LevelDebug
		}

		// Log the request using slog
		slog.Log(context.TODO(), logLevel, "Request processed",
			"method", param.Method,
			"path", requestPath,
			"status", param.StatusCode,
			"client_ip", param.ClientIP,
		)

		// Return empty string since we're using slog for logging
		return ""
	})
}

// CORSMiddleware returns a gin middleware that handles CORS headers
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// JSONMiddleware ensures all API responses have JSON content type
func JSONMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Next()
	}
}
