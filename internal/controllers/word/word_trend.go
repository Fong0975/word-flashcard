package word

import (
	"net/http"
	"time"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// GetWordsTrend @Summary Get daily practice trend across all words
// @Description Get daily practice count / improvement rate / average familiarity score across all words over the last N days, zero-filled for days with no activity
// @Tags words
// @Produce json
// @Param days query int false "Number of days to include (default: 30, max: 90)"
// @Success 200 {array} models.WordTrendPoint "Daily trend points, ascending by date"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid days parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/trend [get]
func (wc *Controller) GetWordsTrend(c *gin.Context) {
	days, err := common.ParseIntQueryParam(c, "days", 30)
	if err != nil || days < 1 || days > 90 {
		common.ResponseError(http.StatusBadRequest, "Invalid days parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	now := time.Now()
	since := now.AddDate(0, 0, -(days - 1))
	where := squirrel.GtOrEq{schema.COMMON_CREATED_AT: since}
	logs, err := wc.wordPracticeLogPeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	common.ResponseSuccess(http.StatusOK, wc.buildWordTrendPoints(logs, days, now), c)
}
