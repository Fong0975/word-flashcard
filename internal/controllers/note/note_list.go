package note

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ListNotes @Summary List all notes with pagination
// @Description Get all notes, supports pagination and multi-column sorting through query parameters
// @Tags notes
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Allowed: id,title,sort_order,created_at,updated_at"
// @Success 200 {array} models.Note "List of notes retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/notes [get]
func (nc *Controller) ListNotes(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(noteSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder1 := fmt.Sprintf("%s ASC", schema.NOTE_SORT_ORDER)
		defaultOrder2 := fmt.Sprintf("%s DESC", schema.NOTE_ID)
		orderByClauses = []*string{&defaultOrder1, &defaultOrder2}
	}

	// ================ 3. Fetch data from database ================
	notes, err := nc.notePeer.Select([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Transform data to API model ================
	noteEntities := nc.convertToNoteEntities(notes)

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntities, c)
}
