package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockHealthController is a mock implementation for HealthController
type MockHealthController struct{}

// NewMockHealthController creates a new mock health controller instance
func NewMockHealthController() *MockHealthController {
	return &MockHealthController{}
}

// HealthCheck mock implementation
func (m *MockHealthController) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "HealthCheck",
		"controller": "HealthController",
		"status":     "ok",
	})
}
