package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockWordController is a mock implementation for WordController
type MockWordController struct{}

// NewMockWordController creates a new mock word controller instance
func NewMockWordController() *MockWordController {
	return &MockWordController{}
}

// ListWords mock implementation
func (m *MockWordController) ListWords(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ListWords",
		"controller": "WordController",
		"status":     "ok",
	})
}

// SearchWords mock implementation
func (m *MockWordController) SearchWords(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "SearchWords",
		"controller": "WordController",
		"status":     "ok",
	})
}

// RandomWords mock implementation
func (m *MockWordController) RandomWords(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "RandomWords",
		"controller": "WordController",
		"status":     "ok",
	})
}

// CreateWord mock implementation
func (m *MockWordController) CreateWord(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CreateWord",
		"controller": "WordController",
		"status":     "ok",
	})
}

// CreateWordDefinition mock implementation
func (m *MockWordController) CreateWordDefinition(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CreateWordDefinition",
		"controller": "WordController",
		"status":     "ok",
	})
}

// UpdateWord mock implementation
func (m *MockWordController) UpdateWord(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "UpdateWord",
		"controller": "WordController",
		"status":     "ok",
	})
}

// UpdateWordDefinition mock implementation
func (m *MockWordController) UpdateWordDefinition(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "UpdateWordDefinition",
		"controller": "WordController",
		"status":     "ok",
	})
}

// DeleteWord mock implementation
func (m *MockWordController) DeleteWord(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "DeleteWord",
		"controller": "WordController",
		"status":     "ok",
	})
}

// DeleteWordDefinition mock implementation
func (m *MockWordController) DeleteWordDefinition(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "DeleteWordDefinition",
		"controller": "WordController",
		"status":     "ok",
	})
}

// CountWords mock implementation
func (m *MockWordController) CountWords(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CountWords",
		"controller": "WordController",
		"status":     "ok",
	})
}
