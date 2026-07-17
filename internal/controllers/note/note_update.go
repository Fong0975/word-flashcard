package note

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// UpdateNote @Summary Update a note
// @Description Update an existing note's properties
// @Tags notes
// @Accept json
// @Produce json
// @Param id path int true "Note ID"
// @Param note body models.Note true "Note data to update"
// @Success 200 {object} models.Note "Note updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid note ID or request body"
// @Failure 404 {object} models.ErrorResponse "Not found - Note not found"
// @Failure 409 {object} models.ErrorResponse "Conflict - A note with this title already exists"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/notes/{id} [put]
func (nc *Controller) UpdateNote(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	noteID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid note ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var noteData models.Note
	if err := common.ParseRequestBody(&noteData, c); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := nc.validateNoteFields(&noteData, true); err != nil {
		common.ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Convert to data model ================
	noteModel := noteData.ToDataModel()
	noteModel.Id = nil // To prevent updating the ID field

	// ================ 3. Update data in database ================
	where := squirrel.Eq{schema.NOTE_ID: noteID}
	effected, err := nc.notePeer.Update(noteModel, where)
	if err != nil {
		common.RespondDatabaseWriteError(
			"Failed to update data in database",
			"A note with this title already exists",
			err, c,
		)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Note not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 4. Query updated data ================
	notes, err := nc.notePeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 5. Transform data to API model ================
	noteEntity := new(models.Note).FromDataModel(notes[0])

	// ================ 6. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntity, c)
}
