package middleware

import (
	"context"
	"log/slog"
	"regexp"
	"slices"
	"strings"

	"word-flashcard/utils/config"

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

// parseAllowedOrigins reads the ALLOWED_ORIGINS allow-list (comma-separated),
// ignoring blank entries so a trailing comma or an empty value is harmless.
// An empty result means "no allow-list configured".
func parseAllowedOrigins() []string {
	var origins []string
	for _, origin := range strings.Split(config.GetOrDefault("ALLOWED_ORIGINS", ""), ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			origins = append(origins, origin)
		}
	}

	return origins
}

// CORSMiddleware returns a gin middleware that handles CORS headers.
//
// With ALLOWED_ORIGINS unset it echoes the historical "Access-Control-Allow-Origin: *",
// so existing deployments keep working untouched. Once the variable lists
// origins, only those are echoed back, which stops an unrelated website the
// user happens to be browsing from reading this API through their browser.
//
// Note what this does and does not buy: it is enforced by the browser, so it
// blocks cross-origin reads from a page, but it is no barrier at all to a
// direct request (curl, or any non-browser client) from inside the network.
// The API still has no authentication.
//
// The allow-list is read once, when the middleware is built, since it cannot
// change without a restart anyway.
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := parseAllowedOrigins()

	return func(c *gin.Context) {
		if len(allowedOrigins) == 0 {
			c.Header("Access-Control-Allow-Origin", "*")
		} else {
			// The response now differs by origin, so caches must key on it --
			// including for a rejected origin, where no allow header is sent
			// at all and the browser blocks the read.
			c.Header("Vary", "Origin")
			if origin := c.Request.Header.Get("Origin"); slices.Contains(allowedOrigins, origin) {
				c.Header("Access-Control-Allow-Origin", origin)
			}
		}

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
