package word

import (
	"github.com/gin-gonic/gin"
)

// ControllerInterface defines the interface for word controller
type ControllerInterface interface {
	ListWords(c *gin.Context)
	SearchWords(c *gin.Context)
	RandomWords(c *gin.Context)
	CreateWord(c *gin.Context)
	CreateWordDefinition(c *gin.Context)
	UpdateWord(c *gin.Context)
	UpdateWordDefinition(c *gin.Context)
	DeleteWord(c *gin.Context)
	DeleteWordDefinition(c *gin.Context)
	CountWords(c *gin.Context)
	StatsWords(c *gin.Context)
	GetWordLogs(c *gin.Context)
	GetWordsTrend(c *gin.Context)
}
