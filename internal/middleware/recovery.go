package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// RecoveryMiddleware recovers from panics in request handlers. Unlike gin's
// default Recovery(), it logs the panic and stack trace through slog (so it
// lands in the same log file as every other API error, not gin's separate
// default writer) and responds with the same JSON error shape ResponseError
// uses elsewhere, instead of an empty body.
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("Panic recovered",
					"path", c.Request.RequestURI,
					"panic", rec,
					"stack", string(debug.Stack()),
				)
				c.AbortWithStatusJSON(http.StatusInternalServerError, models.ErrorResponse{
					Error: "Internal server error",
					Code:  models.ErrCodeInternalError,
				})
			}
		}()
		c.Next()
	}
}
