package health

import (
	"net/http"
	"os"
	"strings"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// InformationCheck handles application information requests
// @Summary Application information endpoint
// @Description Returns application version read from the root VERSION file
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.InformationResponse "Application information"
// @Failure 500 {object} models.ErrorResponse "Internal server error - VERSION file not found or unreadable"
// @Router /api/information [get]
func (hc *Controller) InformationCheck(c *gin.Context) {
	versionPath, err := findVersionFile()
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "version file not found", models.ErrCodeInternalError, err, c)
		return
	}
	data, err := os.ReadFile(versionPath)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "failed to read version file", models.ErrCodeInternalError, err, c)
		return
	}
	common.ResponseSuccess(http.StatusOK, models.InformationResponse{
		Version: strings.TrimSpace(string(data)),
	}, c)
}
