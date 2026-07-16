package word

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// DeleteWord @Summary Delete a word
// @Description Delete a word and all its associated definitions
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Success 204 "Word deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Word not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/{id} [delete]
func (wc *Controller) DeleteWord(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word ID from URL parameter
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	// Check if there are word definitions associated with the word
	whereDefs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: wordID}
	existingDefs, err := wc.wordDefinitionPeer.Select([]*string{}, whereDefs, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to check associated data in database", models.ErrCodeInternalError, err, c)
		return
	}

	// Delete word definitions only if they exist
	if len(existingDefs) > 0 {
		if _, err := wc.wordDefinitionPeer.Delete(whereDefs); err != nil {
			common.ResponseError(http.StatusInternalServerError, "Failed to delete associated data from database", models.ErrCodeInternalError, err, c)
			return
		}
	}

	// Delete the word
	where := squirrel.Eq{schema.WORD_ID: wordID}
	effected, err := wc.wordPeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}
