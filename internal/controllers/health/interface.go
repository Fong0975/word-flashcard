package health

import "github.com/gin-gonic/gin"

// ControllerInterface defines the interface for health controller
type ControllerInterface interface {
	HealthCheck(c *gin.Context)
	InformationCheck(c *gin.Context)
}
