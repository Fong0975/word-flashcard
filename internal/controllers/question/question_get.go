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

// GetQuestions @Summary Get the question
// @Description Get the question by its ID
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} models.Question "A question retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 404 {object} models.ErrorResponse "Not found - Question not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/{id} [get]
func (qc *Controller) GetQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	// Query 'questions' table
	where := squirrel.Eq{schema.COMMON_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	} else if len(questions) == 0 {
		common.ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
		return
	} else if len(questions) != 1 {
		errMsg := fmt.Sprintf("Failed to fetch data from database. %d records match, not equal to 1", len(questions))
		common.ResponseError(http.StatusInternalServerError, errMsg, models.ErrCodeInternalError, nil, c)
		return
	}

	// ================ 3. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, questionEntity, c)

}
