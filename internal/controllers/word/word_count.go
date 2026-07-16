package word

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// CountWords @Summary Count words matching filter criteria
// @Description Count the number of words that match the specified filter criteria across both words and word_definitions tables
// @Tags words
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Success 200 {object} map[string]int64 "Count of words matching the filter criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or filter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/count [post]
func (wc *Controller) CountWords(c *gin.Context) {
	// ============== 1. Get search filter from request ================
	var searchReq models.SearchFilter
	err := common.ParseRequestBody(&searchReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Count words using same logic as SearchWords ================
	count, err := wc.countWordsMatchingFilter(&searchReq)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
