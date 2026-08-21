package backup

import "github.com/gin-gonic/gin"

// ControllerInterface defines the interface for the backup (export/import) controller
type ControllerInterface interface {
	ExportData(c *gin.Context)
	ImportData(c *gin.Context)
	ListBackups(c *gin.Context)
}
