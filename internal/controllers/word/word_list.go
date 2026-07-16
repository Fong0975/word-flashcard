package word

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ListWords @Summary List all words with pagination
// @Description Get all words with their definitions and pronunciation information, supports pagination through query parameters
// @Tags words
// @Accept json
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Success 200 {array} models.Word "List of words retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words [get]
func (wc *Controller) ListWords(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Fetch data from database ================
	// Query 'words' table
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_WORD)
	words, err := wc.wordPeer.Select([]*string{}, nil, []*string{&orderBy}, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// Query 'word_definitions' table
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	wordEntities := wc.transformToWordEntities(words, wordsDefs)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}
