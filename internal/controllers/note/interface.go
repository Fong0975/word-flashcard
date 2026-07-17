package note

import "github.com/gin-gonic/gin"

// ControllerInterface defines the interface for note controller
type ControllerInterface interface {
	ListNotes(c *gin.Context)
	SearchNotes(c *gin.Context)
	GetNote(c *gin.Context)
	CreateNote(c *gin.Context)
	UpdateNote(c *gin.Context)
	DeleteNote(c *gin.Context)
	CountNotes(c *gin.Context)
}
