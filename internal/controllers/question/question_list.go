package question

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ListQuestions @Summary List all questions with pagination
// @Description Get all questions, supports pagination and multi-column sorting through query parameters
// @Tags questions
// @Accept json
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Format: col,-col,(expr),-(expr). Allowed: id,question,answer,count_practise,count_failure_practise,created_at,updated_at"
// @Success 200 {array} models.Question "List of Questions retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions [get]
func (qc *Controller) ListQuestions(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(questionSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Build ORDER BY clauses: use provided sort or fall back to default
	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder1 := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
		defaultOrder2 := fmt.Sprintf("%s DESC", schema.QUESTION_ID)
		orderByClauses = []*string{&defaultOrder1, &defaultOrder2}
	}

	// ================ 3. Fetch data from database ================
	questions, err := qc.questionPeer.Select([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Transform data to API model ================
	questionEntities := qc.convertToEntities(questions)

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, questionEntities, c)
}
