package logs

import (
	"fmt"
	"net/http"
	"time"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// DownloadLogs @Summary Download the backend log files
// @Description Downloads the current log file and its rotated siblings as an attachment. A single file is sent as plain text; several are sent as one zip archive built in memory.
// @Tags logs
// @Produce plain,application/zip
// @Success 200 {file} file "The log file, or a zip archive of all log files"
// @Failure 404 {object} models.ErrorResponse "Not found - No log files exist yet"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to read or compress the log files"
// @Router /api/logs/download [get]
func (lc *Controller) DownloadLogs(c *gin.Context) {
	// ================ 1. Package the log files ================
	export, err := BuildLogExport(LogFilePath(), time.Now())
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to export log files", models.ErrCodeInternalError, err, c)
		return
	}
	if export == nil {
		common.ResponseError(http.StatusNotFound, "No log files found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 2. Send response ================
	// JSONMiddleware has already set Content-Type to application/json, and
	// c.Data only fills the header in when it is empty, so it has to be
	// overwritten explicitly here.
	c.Header("Content-Type", export.ContentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", export.FileName))
	c.Data(http.StatusOK, export.ContentType, export.Content)
}
