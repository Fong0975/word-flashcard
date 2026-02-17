package controllers

import (
	"github.com/gin-gonic/gin"
)

// QuestionControllerInterface defines the interface for question controller
type QuestionControllerInterface interface {
	ListQuestions(c *gin.Context)
	GetQuestions(c *gin.Context)
	RandomQuestions(c *gin.Context)
	CreateQuestions(c *gin.Context)
	UpdateQuestions(c *gin.Context)
	DeleteQuestions(c *gin.Context)
	CountQuestions(c *gin.Context)
}
