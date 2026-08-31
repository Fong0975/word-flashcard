package logs

import (
	"net/http"
	"time"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// MarkLogsRead @Summary Mark log entries as read
// @Description Advances the read watermark to now, clearing the unread count. The watermark is global and ignores any filter the caller is viewing.
// @Tags logs
// @Produce json
// @Success 200 {object} ReadState "The stored watermark after the update"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to persist the read state"
// @Router /api/logs/read [post]
func (lc *Controller) MarkLogsRead(c *gin.Context) {
	// ================ 1. Persist the new watermark ================
	state := ReadState{LastReadAt: time.Now()}
	if err := SaveReadState(ReadStateFilePath(), state); err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to save log read state", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Send response ================
	common.ResponseSuccess(http.StatusOK, state, c)
}
