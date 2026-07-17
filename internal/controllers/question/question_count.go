package question

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// CountQuestions @Summary Count total questions
// @Description Get the total count of questions in the database
// @Tags questions
// @Accept json
// @Produce json
// @Success 200 {object} map[string]int64 "Total count of questions"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count questions in database"
// @Router /api/questions/count [get]
func (qc *Controller) CountQuestions(c *gin.Context) {
	// ================ 1. Fetch data from database ================
	count, err := qc.questionPeer.Count()
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count questions in database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
