package controllers

import "github.com/gin-gonic/gin"

// NoteControllerInterface defines the interface for note controller
type NoteControllerInterface interface {
	ListNotes(c *gin.Context)
	SearchNotes(c *gin.Context)
	GetNote(c *gin.Context)
	CreateNote(c *gin.Context)
	UpdateNote(c *gin.Context)
	DeleteNote(c *gin.Context)
	CountNotes(c *gin.Context)
}
