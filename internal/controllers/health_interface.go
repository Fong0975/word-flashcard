package controllers

import "github.com/gin-gonic/gin"

// HealthControllerInterface defines the interface for health controller
type HealthControllerInterface interface {
	HealthCheck(c *gin.Context)
}
