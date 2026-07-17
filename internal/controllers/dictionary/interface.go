package dictionary

import "github.com/gin-gonic/gin"

// ControllerInterface defines the interface for dictionary controller
type ControllerInterface interface {
	SearchWord(c *gin.Context)
}
