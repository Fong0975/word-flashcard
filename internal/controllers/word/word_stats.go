package word

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// StatsWords @Summary Get word statistics
// @Description Get word count distribution by familiarity level and practice count
// @Tags words
// @Produce json
// @Success 200 {object} models.WordStats "Word familiarity distribution"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count words"
// @Router /api/words/stats [get]
func (wc *Controller) StatsWords(c *gin.Context) {
	// ================ 1. Count per familiarity level ================
	red, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_RED})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}
	yellow, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}
	green, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_GREEN})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Fetch practice counts for all words ================
	cpCol := schema.WORD_COUNT_PRACTISE
	words, err := wc.wordPeer.Select([]*string{&cpCol}, nil, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch practice counts", models.ErrCodeInternalError, err, c)
		return
	}

	counts := make([]int, len(words))
	for i, w := range words {
		if w.CountPractise != nil {
			counts[i] = *w.CountPractise
		}
	}

	// ================ 3. Bucket words by practice count ================
	practiceBuckets := common.BuildPracticeCountBuckets(counts)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, models.WordStats{
		FamiliarityDistribution: models.WordFamiliarityDistribution{
			Red:    red,
			Yellow: yellow,
			Green:  green,
		},
		PracticeCountDistribution: practiceBuckets,
	}, c)
}
