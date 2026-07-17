package note

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// SearchNotes @Summary Search notes with filters and pagination
// @Description Search for notes using specified filter criteria. Supports equal, not equal, in, not in, like and other operations with pagination.
// @Tags notes
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Allowed: id,title,sort_order,created_at,updated_at"
// @Success 200 {array} models.Note "Notes found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body, filter, or query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/notes/search [post]
func (nc *Controller) SearchNotes(c *gin.Context) {
	// ================ 1. Get search filter from request ================
	var searchReq models.SearchFilter
	if err := common.ParseRequestBody(&searchReq, c); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 3. Parse and validate sort parameters ================
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

	// ================ 4. Convert filter to SQL condition ================
	where, err := searchReq.ToSqlizer()
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid search filter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 5. Fetch data from database ================
	notes, err := nc.notePeer.Select([]*string{}, where, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 6. Transform data to API model ================
	noteEntities := []*models.Note{}
	if len(notes) > 0 {
		noteEntities = nc.convertToNoteEntities(notes)
	}

	// ================ 7. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntities, c)
}
