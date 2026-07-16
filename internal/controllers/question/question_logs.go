package question

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// GetQuestionLogs @Summary Get recent answer log entries for a question
// @Description Get the most recent answer log entries for a question, most recent first
// @Tags questions
// @Produce json
// @Param id path int true "Question ID"
// @Param limit query int false "Maximum number of entries to return (default: 15, max: 50)"
// @Success 200 {array} models.QuestionAnswerLogEntry "Recent answer log entries"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID or limit parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/{id}/logs [get]
func (qc *Controller) GetQuestionLogs(c *gin.Context) {
	// ================ 1. Parse request parameters ================
	questionID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	limit, err := common.ParseIntQueryParam(c, "limit", 15)
	if err != nil || limit < 1 || limit > 50 {
		common.ResponseError(http.StatusBadRequest, "Invalid limit parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)

	// ================ 2. Fetch data from database ================
	where := squirrel.Eq{schema.QUESTION_ANSWER_LOG_QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	logs, err := qc.questionAnswerLogPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	entries := qc.toQuestionAnswerLogEntries(logs)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, entries, c)
}
