package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// HealthController handles health-related requests
type HealthController struct{}

// NewHealthController creates a new HealthController instance
func NewHealthController() *HealthController {
	return &HealthController{}
}

// findVersionFile walks up the directory tree from the current working directory
// until it locates a VERSION file, returning its absolute path.
func findVersionFile() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		path := filepath.Join(dir, "VERSION")
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("VERSION file not found in any parent directory")
		}
		dir = parent
	}
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

// InformationCheck handles application information requests
// @Summary Application information endpoint
// @Description Returns application version read from the root VERSION file
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.InformationResponse "Application information"
// @Failure 500 {object} map[string]string "Failed to read version file"
// @Router /api/information [get]
func (hc *HealthController) InformationCheck(c *gin.Context) {
	versionPath, err := findVersionFile()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "version file not found"})
		return
	}
	data, err := os.ReadFile(versionPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read version file"})
		return
	}
	c.JSON(http.StatusOK, models.InformationResponse{
		Version: strings.TrimSpace(string(data)),
	})
}
