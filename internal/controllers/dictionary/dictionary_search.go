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
// @Description Get dictionary definition and pronunciation for a given word by scraping Cambridge Dictionary
// @Tags dictionary
// @Accept json
// @Produce json
// @Param language path string true "Dictionary language slug (only en-tw is currently supported)"
// @Param word path string true "Word to search for"
// @Success 200 {object} models.CambridgeResponse "Dictionary definition found successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Missing word parameter or unsupported language"
// @Failure 404 {object} models.ErrorResponse "Not found - Word not found in the dictionary"
// @Failure 502 {object} models.ErrorResponse "Bad gateway - Cambridge Dictionary is currently unavailable"
// @Router /api/dictionary/{language}/{word} [get]
func (dc *Controller) SearchWord(c *gin.Context) {
	word := c.Param("word")
	language := c.Param("language")

	// Validate word parameter
	if word == "" {
		common.ResponseError(http.StatusBadRequest, "Word parameter is required", models.ErrCodeInvalidRequest, nil, c)
		return
	}

	// Check cache first
	cacheKey := fmt.Sprintf("dict_%s_%s", language, strings.ReplaceAll(word, " ", "_"))
	if cached := dc.getFromCache(cacheKey); cached != nil {
		if response, ok := cached.(models.CambridgeResponse); ok {
			c.JSON(http.StatusOK, response)
			return
		}
	}

	// Fetch word data by scraping Cambridge Dictionary
	response, err := dc.fetchWordDataFromCambridge(word, language)
	if err != nil {
		switch {
		case errors.Is(err, errUnsupportedLanguage):
			common.ResponseError(http.StatusBadRequest, fmt.Sprintf("Unsupported language '%s'", language), models.ErrCodeInvalidRequest, err, c)
		case errors.Is(err, errWordNotFound):
			common.ResponseError(http.StatusNotFound, fmt.Sprintf("Word '%s' not found", word), models.ErrCodeNotFound, err, c)
		default:
			common.ResponseError(http.StatusBadGateway, "Dictionary service is currently unavailable", models.ErrCodeUpstreamUnavailable, err, c)
		}
		return
	}

	// Cache the result
	dc.setCache(cacheKey, *response)

	// Return response
	c.JSON(http.StatusOK, response)
}
