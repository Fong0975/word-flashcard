package word

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// DeleteWordDefinition @Summary Delete a word definition
// @Description Delete a specific word definition
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word definition ID"
// @Success 204 "Word definition deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Word definition not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/definition/{id} [delete]
func (wc *Controller) DeleteWordDefinition(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word definition ID from URL parameter
	wordDefID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word definition ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	effected, err := wc.wordDefinitionPeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word definition not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}
