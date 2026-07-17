package word

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// SearchWords @Summary Search words with filters and pagination
// @Description Search for words using specified filter criteria across both words and word_definitions tables. Supports equal, not equal, in, and not in operations with pagination.
// @Tags words
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns, comma-separated. Format: col,-col. Allowed: id,word,familiarity,count_practise,created_at"
// @Success 200 {array} models.Word "Words found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body, filter, or query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/search [post]
func (wc *Controller) SearchWords(c *gin.Context) {
	// ============== 1. Get search filter from request ================
	var searchReq models.SearchFilter
	err := common.ParseRequestBody(&searchReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 3. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(wordSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Build ORDER BY clauses: use provided sort or fall back to default
	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder := fmt.Sprintf("%s ASC", schema.WORD_WORD)
		orderByClauses = []*string{&defaultOrder}
	}

	// ================ 4. Handle empty search filter ================
	if searchReq.IsEmpty() {
		// No filter, fetch all records with pagination
		wordEntities, err := wc.fetchWordsWithDefinitions([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
		if err != nil {
			common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
			return
		}
		if len(wordEntities) == 0 {
			wordEntities = []*models.Word{}
		}
		common.ResponseSuccess(http.StatusOK, wordEntities, c)
		return
	}

	// ================ 5. Separate conditions by table ================
	wordsFilter, wordDefsFilter, err := parseSearchConditionsByTable(&searchReq)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid filter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 6. Query each table separately ================
	wordsIDs, err := wc.queryWordIDsByTableFilter(wordsFilter, false)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to query words table", models.ErrCodeInternalError, err, c)
		return
	}

	wordDefsIDs, err := wc.queryWordIDsByTableFilter(wordDefsFilter, true)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to query word_definitions table", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 7. Combine results based on logic operator ================
	finalWordIDs := wc.combineWordIDsWithLogic(wordsIDs, wordDefsIDs, searchReq.Logic)

	// ================ 8. Query final words with pagination ================
	wordEntities, err := wc.queryWordsByIDsWithPagination(finalWordIDs, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch final word data from database", models.ErrCodeInternalError, err, c)
		return
	}
	if len(wordEntities) == 0 {
		wordEntities = []*models.Word{}
	}

	// ================ 9. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}
