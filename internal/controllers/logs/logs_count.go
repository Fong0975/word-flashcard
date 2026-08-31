package logs

import (
	"net/http"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// CountLogs @Summary Count backend log entries matching a filter
// @Description Counts entries matching the level and time range filter. Paired with GET /api/logs so the frontend can page, mirroring the words search/count pair.
// @Tags logs
// @Produce json
// @Param level query string false "Comma-separated level names, e.g. WARN,ERROR"
// @Param from query string false "Inclusive lower bound, RFC3339 or YYYY-MM-DD"
// @Param to query string false "Inclusive upper bound, RFC3339 or YYYY-MM-DD"
// @Success 200 {object} map[string]int "Count of matching entries"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid time range"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to read the log files"
// @Router /api/logs/count [get]
func (lc *Controller) CountLogs(c *gin.Context) {
	// ================ 1. Parse filter parameters ================
	filter, err := ParseFilterParams(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid log filter parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Count matching entries ================
	count, err := CountEntries(LogFilePath(), filter)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to read log files", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
