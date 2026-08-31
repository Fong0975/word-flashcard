package logs

import (
	"log/slog"
	"net/http"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// UnreadLogs @Summary Count unread log entries
// @Description Counts entries newer than the stored read watermark whose level is at least LOG_NOTIFY_LEVEL. Cheap enough to poll.
// @Tags logs
// @Produce json
// @Success 200 {object} map[string]int "Count of unread entries at or above the notify level"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to read the log files"
// @Router /api/logs/unread [get]
func (lc *Controller) UnreadLogs(c *gin.Context) {
	// ================ 1. Load the read watermark ================
	// A damaged state file degrades to "everything is unread" rather than
	// failing the request: this endpoint only drives an indicator, and a
	// 500 here would break it permanently until someone deleted the file.
	statePath := ReadStateFilePath()
	state, err := LoadReadState(statePath)
	if err != nil {
		slog.Warn("Failed to load log read state; treating all entries as unread", "path", statePath, "error", err)
	}

	// ================ 2. Count entries above the watermark ================
	count, err := CountUnread(LogFilePath(), state.LastReadAt, NotifyLevel())
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to read log files", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
