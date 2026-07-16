package question

import (
	"net/http"
	"time"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// GetQuestionsTrend @Summary Get daily answer trend across all questions
// @Description Get daily practice count / accuracy rate across all questions over the last N days, zero-filled for days with no activity
// @Tags questions
// @Produce json
// @Param days query int false "Number of days to include (default: 30, max: 90)"
// @Success 200 {array} models.QuestionTrendPoint "Daily trend points, ascending by date"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid days parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/trend [get]
func (qc *Controller) GetQuestionsTrend(c *gin.Context) {
	// ================ 1. Parse request parameters ================
	days, err := common.ParseIntQueryParam(c, "days", 30)
	if err != nil || days < 1 || days > 90 {
		common.ResponseError(http.StatusBadRequest, "Invalid days parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	now := time.Now()
	since := now.AddDate(0, 0, -(days - 1))
	where := squirrel.GtOrEq{schema.COMMON_CREATED_AT: since}
	logs, err := qc.questionAnswerLogPeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Aggregate into zero-filled daily trend points ================
	points := qc.buildQuestionTrendPoints(logs, days, now)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, points, c)
}
