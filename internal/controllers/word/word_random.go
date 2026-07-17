package word

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// RandomWords @Summary Get random words weighted by familiarity and practice recency
// @Description Get random words for a quiz, weighted by familiarity ratio (familiarity_levels) or exact quota (per_category_counts); prioritizes never-practiced then longest-idle words
// @Tags words
// @Accept json
// @Produce json
// @Param randomRequest body models.WordRandomRequest true "Random request criteria including count and either familiarity_levels or per_category_counts"
// @Success 200 {array} models.Word "Random words retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or count parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/random [post]
func (wc *Controller) RandomWords(c *gin.Context) {
	// ============== 1. Get random request from body ================
	var randomReq models.WordRandomRequest
	err := common.ParseRequestBody(&randomReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Validate count parameter
	if randomReq.Count <= 0 || randomReq.Count > 1000 {
		common.ResponseError(http.StatusBadRequest, "Count must be between 1 and 1000", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 2. Determine per-level quotas ================
	var quotas map[string]int
	if len(randomReq.PerCategoryCounts) > 0 {
		quotas = randomReq.PerCategoryCounts
	} else if len(randomReq.FamiliarityLevels) > 0 {
		quotas = computeLevelQuotas(randomReq.Count, randomReq.FamiliarityLevels)
	} else {
		common.ResponseError(http.StatusBadRequest, "Either familiarity_levels or per_category_counts is required", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 3. Fetch weighted random words ================
	words, err := wc.fetchRandomWordsWeighted(quotas)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Attach definitions and build response ================
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}
	wordEntities := wc.transformToWordEntities(words, wordsDefs)
	if len(wordEntities) == 0 {
		wordEntities = []*models.Word{}
	}

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}
