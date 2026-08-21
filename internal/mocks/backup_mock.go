package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockBackupController is a mock implementation for BackupController
type MockBackupController struct{}

// NewMockBackupController creates a new mock backup controller instance
func NewMockBackupController() *MockBackupController {
	return &MockBackupController{}
}

// ExportData mock implementation
func (m *MockBackupController) ExportData(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ExportData",
		"controller": "BackupController",
		"status":     "ok",
	})
}

// ImportData mock implementation
func (m *MockBackupController) ImportData(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ImportData",
		"controller": "BackupController",
		"status":     "ok",
	})
}

// ListBackups mock implementation
func (m *MockBackupController) ListBackups(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ListBackups",
		"controller": "BackupController",
		"status":     "ok",
	})
}
