package question

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// RandomQuestions @Summary Get random questions
// @Description Randomly obtain the required number of questions
// @Tags questions
// @Accept json
// @Produce json
// @Param randomFilter body models.QuestionRandomRequest true "Random filter criteria including count and optional filter"
// @Success 200 {array} models.Question "Random questions retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or count parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/random [post]
func (qc *Controller) RandomQuestions(c *gin.Context) {
	// ============== 1. Get random filter from request ================
	var randomReq models.QuestionRandomRequest
	err := common.ParseRequestBody(&randomReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if randomReq.Count <= 0 || randomReq.Count > 1000 {
		common.ResponseError(http.StatusBadRequest, "Invalid request body - count", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 2. Fetch data from database ================
	// Use weighted bucket sampling: unpractised (50%) > high-failure-rate (30%) > high-success-rate (20%)
	questions, err := qc.fetchRandomQuestionsWeighted(randomReq.Count, randomReq.ExcludeRecentDays)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	var questionEntities = []*models.Question{}
	if len(questions) > 0 {
		questionEntities = qc.convertToEntities(questions)
	}

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, questionEntities, c)
}
