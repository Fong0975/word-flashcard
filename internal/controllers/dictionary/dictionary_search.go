package dictionary

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// SearchWord handles dictionary lookup requests
// @Summary Search dictionary for word definition
// @Description Get dictionary definition and pronunciation for a given word from Cambridge Dictionary API
// @Tags dictionary
// @Accept json
// @Produce json
// @Param word path string true "Word to search for"
// @Success 200 {object} models.DictionaryResponse "Dictionary definition found successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Missing word parameter"
// @Failure 404 {object} models.ErrorResponse "Not found - Word not found in the dictionary"
// @Failure 502 {object} models.ErrorResponse "Bad gateway - Dictionary service unavailable"
// @Router /api/dictionary/{word} [get]
func (dc *Controller) SearchWord(c *gin.Context) {
	word := c.Param("word")

	// Validate word parameter
	if word == "" {
		common.ResponseError(http.StatusBadRequest, "Word parameter is required", models.ErrCodeInvalidRequest, nil, c)
		return
	}

	// Check cache first
	cacheKey := fmt.Sprintf("dict_%s", strings.ReplaceAll(word, " ", "_"))
	if cached := dc.getFromCache(cacheKey); cached != nil {
		if response, ok := cached.(models.DictionaryResponse); ok {
			c.JSON(http.StatusOK, response)
			return
		}
	}

	// Fetch word data from Cambridge dictionary API
	response, err := dc.fetchWordDataFromCambridgeAPI(word)
	if err != nil {
		if errors.Is(err, errWordNotFound) {
			common.ResponseError(http.StatusNotFound, fmt.Sprintf("Word '%s' not found", word), models.ErrCodeNotFound, err, c)
			return
		}
		common.ResponseError(http.StatusBadGateway, "Dictionary service is currently unavailable", models.ErrCodeUpstreamUnavailable, err, c)
		return
	}

	// Cache the result
	dc.setCache(cacheKey, *response)

	// Return response
	c.JSON(http.StatusOK, response)
}
