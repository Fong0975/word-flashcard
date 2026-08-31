package logs

import (
	"net/http"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ListLogs @Summary List backend log entries
// @Description Returns parsed entries from the current log file and its rotated siblings, newest first, filtered by level and time range.
// @Tags logs
// @Produce json
// @Param limit query int false "Maximum entries to return (1-1000, default 100)"
// @Param offset query int false "Entries to skip (default 0)"
// @Param level query string false "Comma-separated level names, e.g. WARN,ERROR"
// @Param from query string false "Inclusive lower bound, RFC3339 or YYYY-MM-DD"
// @Param to query string false "Inclusive upper bound, RFC3339 or YYYY-MM-DD"
// @Success 200 {array} models.LogEntry "Log entries, newest first"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid limit/offset or time range"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to read the log files"
// @Router /api/logs [get]
func (lc *Controller) ListLogs(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Parse filter parameters ================
	filter, err := ParseFilterParams(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid log filter parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 3. Scan the log files ================
	entries, err := ScanEntries(LogFilePath(), filter, offset, limit)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to read log files", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, entries, c)
}
