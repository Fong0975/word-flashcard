package question

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// DeleteQuestions @Summary Delete a question
// @Description Delete a specific question
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 204 "Question deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Question not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/questions/{id} [delete]
func (qc *Controller) DeleteQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	effected, err := qc.questionPeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}
