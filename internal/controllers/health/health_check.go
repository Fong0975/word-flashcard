package health

import (
	"net/http"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// HealthCheck handles health check requests
// @Summary Health check endpoint
// @Description Returns server status to verify the service is running
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.HealthResponse "Server is healthy"
// @Router /api/health [get]
func (hc *Controller) HealthCheck(c *gin.Context) {
	response := models.HealthResponse{
		Status: "OK",
	}
	c.JSON(http.StatusOK, response)
}
