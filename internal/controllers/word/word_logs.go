package word

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// GetWordLogs @Summary Get recent practice log entries for a word
// @Description Get the most recent practice log entries for a word, most recent first
// @Tags words
// @Produce json
// @Param id path int true "Word ID"
// @Param limit query int false "Maximum number of entries to return (default: 10, max: 50)"
// @Success 200 {array} models.WordPracticeLogEntry "Recent practice log entries"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID or limit parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/{id}/logs [get]
func (wc *Controller) GetWordLogs(c *gin.Context) {
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	limit, err := common.ParseIntQueryParam(c, "limit", 10)
	if err != nil || limit < 1 || limit > 50 {
		common.ResponseError(http.StatusBadRequest, "Invalid limit parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)

	where := squirrel.Eq{schema.WORD_PRACTICE_LOG_WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	logs, err := wc.wordPracticeLogPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	common.ResponseSuccess(http.StatusOK, wc.toWordPracticeLogEntries(logs), c)
}
