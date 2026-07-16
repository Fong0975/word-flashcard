package note

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// CreateNote @Summary Create a new note
// @Description Create a new note card entry
// @Tags notes
// @Accept json
// @Produce json
// @Param note body models.Note true "Note data to create"
// @Success 200 {object} models.Note "Note created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body"
// @Failure 409 {object} models.ErrorResponse "Conflict - A note with this title already exists"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/notes [post]
func (nc *Controller) CreateNote(c *gin.Context) {
	// ================ 1. Parse request body ================
	var noteData models.Note
	if err := common.ParseRequestBody(&noteData, c); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := nc.validateNoteFields(&noteData, false); err != nil {
		common.ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Insert data into database ================
	noteID, err := nc.notePeer.Insert(noteData.ToDataModel())
	if err != nil {
		common.RespondDatabaseWriteError(
			"Failed to insert data into database",
			"A note with this title already exists",
			err, c,
		)
		return
	}

	// ================ 3. Query inserted data ================
	where := squirrel.Eq{schema.NOTE_ID: noteID}
	notes, err := nc.notePeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Transform data to API model ================
	noteEntity := new(models.Note).FromDataModel(notes[0])

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntity, c)
}
