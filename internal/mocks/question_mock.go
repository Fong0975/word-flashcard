package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockQuestionController is a mock implementation for QuestionController
type MockQuestionController struct{}

// NewMockQuestionController creates a new mock word controller instance
func NewMockQuestionController() *MockQuestionController {
	return &MockQuestionController{}
}

// ListQuestions mock implementation
func (m *MockQuestionController) ListQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ListQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// GetQuestions mock implementation
func (m *MockQuestionController) GetQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "GetQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// RandomQuestions mock implementation
func (m *MockQuestionController) RandomQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "RandomQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// CreateQuestions mock implementation
func (m *MockQuestionController) CreateQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CreateQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// UpdateQuestions mock implementation
func (m *MockQuestionController) UpdateQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "UpdateQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// DeleteQuestions mock implementation
func (m *MockQuestionController) DeleteQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "DeleteQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}

// CountQuestions mock implementation
func (m *MockQuestionController) CountQuestions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CountQuestions",
		"controller": "QuestionController",
		"status":     "ok",
	})
}
