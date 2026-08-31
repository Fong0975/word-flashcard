package logs

import "github.com/gin-gonic/gin"

// ControllerInterface defines the interface for logs controller
type ControllerInterface interface {
	ListLogs(c *gin.Context)
	CountLogs(c *gin.Context)
	UnreadLogs(c *gin.Context)
	MarkLogsRead(c *gin.Context)
}
