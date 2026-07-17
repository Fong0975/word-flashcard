package question

import (
	"github.com/gin-gonic/gin"
)

// ControllerInterface defines the interface for question controller
type ControllerInterface interface {
	ListQuestions(c *gin.Context)
	GetQuestions(c *gin.Context)
	RandomQuestions(c *gin.Context)
	CreateQuestions(c *gin.Context)
	UpdateQuestions(c *gin.Context)
	DeleteQuestions(c *gin.Context)
	CountQuestions(c *gin.Context)
	StatsQuestions(c *gin.Context)
	GetQuestionLogs(c *gin.Context)
	GetQuestionsTrend(c *gin.Context)
}
