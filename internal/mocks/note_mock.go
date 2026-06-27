package mocks

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MockNoteController is a mock implementation for NoteController
type MockNoteController struct{}

// NewMockNoteController creates a new mock note controller instance
func NewMockNoteController() *MockNoteController {
	return &MockNoteController{}
}

// ListNotes mock implementation
func (m *MockNoteController) ListNotes(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "ListNotes",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// SearchNotes mock implementation
func (m *MockNoteController) SearchNotes(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "SearchNotes",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// GetNote mock implementation
func (m *MockNoteController) GetNote(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "GetNote",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// CreateNote mock implementation
func (m *MockNoteController) CreateNote(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CreateNote",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// UpdateNote mock implementation
func (m *MockNoteController) UpdateNote(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "UpdateNote",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// DeleteNote mock implementation
func (m *MockNoteController) DeleteNote(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "DeleteNote",
		"controller": "NoteController",
		"status":     "ok",
	})
}

// CountNotes mock implementation
func (m *MockNoteController) CountNotes(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"method":     "CountNotes",
		"controller": "NoteController",
		"status":     "ok",
	})
}
