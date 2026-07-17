package note

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// DeleteNote @Summary Delete a note
// @Description Delete a specific note
// @Tags notes
// @Param id path int true "Note ID"
// @Success 204 "Note deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid note ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Note not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/notes/{id} [delete]
func (nc *Controller) DeleteNote(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	noteID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid note ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.NOTE_ID: noteID}
	effected, err := nc.notePeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Note not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}
