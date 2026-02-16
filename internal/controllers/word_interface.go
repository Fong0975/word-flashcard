package controllers

import (
	"github.com/gin-gonic/gin"
)

// WordControllerInterface defines the interface for word controller
type WordControllerInterface interface {
	ListWords(c *gin.Context)
	SearchWords(c *gin.Context)
	RandomWords(c *gin.Context)
	CreateWord(c *gin.Context)
	CreateWordDefinition(c *gin.Context)
	UpdateWord(c *gin.Context)
	UpdateWordDefinition(c *gin.Context)
	DeleteWord(c *gin.Context)
	DeleteWordDefinition(c *gin.Context)
	CountQuestions(c *gin.Context)
}
