package question

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// CountQuestions @Summary Count questions matching filter criteria
// @Description Count the questions matching the filter criteria. An empty body counts all questions. Allowed condition keys: question, option_a, option_b, option_c, option_d.
// @Tags questions
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter false "Search filter criteria"
// @Success 200 {object} map[string]int64 "Count of questions matching the filter criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or filter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count questions in database"
// @Router /api/questions/count [post]
func (qc *Controller) CountQuestions(c *gin.Context) {
	// ================ 1. Get search filter from request ================
	where, ok := parseQuestionSearchFilter(c)
	if !ok {
		return
	}

	// ================ 2. Fetch data from database ================
	count, err := qc.questionPeer.Count(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count questions in database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
