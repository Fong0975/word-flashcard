package controllers

import (
	"net/http"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// HealthController handles health-related requests
type HealthController struct{}

// NewHealthController creates a new HealthController instance
func NewHealthController() *HealthController {
	return &HealthController{}
}

// HealthCheck handles health check requests
// @Summary Health check endpoint
// @Description Returns server status to verify the service is running
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.HealthResponse "Server is healthy"
// @Router /api/health [get]
func (hc *HealthController) HealthCheck(c *gin.Context) {
	response := models.HealthResponse{
		Status: "OK",
	}
	c.JSON(http.StatusOK, response)
}
