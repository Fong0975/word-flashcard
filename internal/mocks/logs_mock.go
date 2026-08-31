package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockLogsController is a mock implementation for LogsController
type MockLogsController struct{}

// NewMockLogsController creates a new mock logs controller instance
func NewMockLogsController() *MockLogsController {
	return &MockLogsController{}
}

// ListLogs mock implementation
func (m *MockLogsController) ListLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ListLogs",
		"controller": "LogsController",
		"status":     "ok",
	})
}

// CountLogs mock implementation
func (m *MockLogsController) CountLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CountLogs",
		"controller": "LogsController",
		"status":     "ok",
	})
}

// UnreadLogs mock implementation
func (m *MockLogsController) UnreadLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "UnreadLogs",
		"controller": "LogsController",
		"status":     "ok",
	})
}

// MarkLogsRead mock implementation
func (m *MockLogsController) MarkLogsRead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "MarkLogsRead",
		"controller": "LogsController",
		"status":     "ok",
	})
}
