package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// TestRecoveryMiddlewarePanic tests that RecoveryMiddleware recovers from a
// panic and responds with the shared error JSON shape.
func (s *middlewareTestSuite) TestRecoveryMiddlewarePanic() {
	s.router.Use(RecoveryMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		panic("boom")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	s.Equal(http.StatusInternalServerError, recorder.Code)

	var body models.ErrorResponse
	s.NoError(json.Unmarshal(recorder.Body.Bytes(), &body))
	s.Equal(models.ErrCodeInternalError, body.Code)
	s.Equal("Internal server error", body.Error)

	logOutput := s.logBuffer.String()
	s.Contains(logOutput, "Panic recovered", "Log should record the recovered panic")
	s.Contains(logOutput, "/test", "Log should record the request path")
}

// TestRecoveryMiddlewareNoPanic tests that RecoveryMiddleware leaves a
// normal response untouched when no panic occurs.
func (s *middlewareTestSuite) TestRecoveryMiddlewareNoPanic() {
	s.router.Use(RecoveryMiddleware())
	s.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	recorder := httptest.NewRecorder()

	s.router.ServeHTTP(recorder, req)

	s.Equal(http.StatusOK, recorder.Code)
	s.JSONEq(`{"message":"success"}`, recorder.Body.String())
}
