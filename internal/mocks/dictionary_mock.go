package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockDictionaryController is a mock implementation for DictionaryController
type MockDictionaryController struct{}

// NewMockDictionaryController creates a new mock dictionary controller instance
func NewMockDictionaryController() *MockDictionaryController {
	return &MockDictionaryController{}
}

// SearchWord mock implementation
func (m *MockDictionaryController) SearchWord(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "SearchWord",
		"controller": "DictionaryController",
		"word":       c.Param("word"),
	})
}
