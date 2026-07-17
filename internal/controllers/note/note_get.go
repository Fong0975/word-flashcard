package note

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// GetNote @Summary Get a note
// @Description Get a specific note by its ID
// @Tags notes
// @Produce json
// @Param id path int true "Note ID"
// @Success 200 {object} models.Note "Note retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid note ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Note not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/notes/{id} [get]
func (nc *Controller) GetNote(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	noteID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid note ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	where := squirrel.Eq{schema.NOTE_ID: noteID}
	notes, err := nc.notePeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	} else if len(notes) == 0 {
		common.ResponseError(http.StatusNotFound, "Note not found", models.ErrCodeNotFound, nil, c)
		return
	} else if len(notes) != 1 {
		errMsg := fmt.Sprintf("Failed to fetch data from database. %d records match, not equal to 1", len(notes))
		common.ResponseError(http.StatusInternalServerError, errMsg, models.ErrCodeInternalError, nil, c)
		return
	}

	// ================ 3. Transform data to API model ================
	noteEntity := new(models.Note).FromDataModel(notes[0])

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntity, c)
}
