package controllers

import (
	"fmt"
	"net/http"
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// noteSortableColumns defines the columns allowed in sort query parameters for the notes table.
var noteSortableColumns = []string{
	schema.NOTE_ID,
	schema.NOTE_TITLE,
	schema.NOTE_SORT_ORDER,
	schema.COMMON_CREATED_AT,
	schema.COMMON_UPDATED_AT,
}

// NoteController handles note-related requests
type NoteController struct {
	notePeer peers.NotePeerInterface
}

// NewNoteController creates a new NoteController instance
func NewNoteController(notePeer peers.NotePeerInterface) *NoteController {
	return &NoteController{notePeer: notePeer}
}

// GetReelNotePeer returns the real database peer for notes
func GetReelNotePeer() (peers.NotePeerInterface, error) {
	return peers.NewNotePeer()
}

// ListNotes @Summary List all notes with pagination
// @Description Get all notes, supports pagination and multi-column sorting through query parameters
// @Tags notes
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Allowed: id,title,sort_order,created_at,updated_at"
// @Success 200 {array} models.Note "List of notes retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/notes [get]
func (nc *NoteController) ListNotes(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(noteSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder1 := fmt.Sprintf("%s ASC", schema.NOTE_SORT_ORDER)
		defaultOrder2 := fmt.Sprintf("%s DESC", schema.NOTE_ID)
		orderByClauses = []*string{&defaultOrder1, &defaultOrder2}
	}

	// ================ 3. Fetch data from database ================
	notes, err := nc.notePeer.Select([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Transform data to API model ================
	noteEntities := nc.convertToNoteEntities(notes)

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntities, c)
}

// SearchNotes @Summary Search notes with filters and pagination
// @Description Search for notes using specified filter criteria. Supports equal, not equal, in, not in, like and other operations with pagination.
// @Tags notes
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Allowed: id,title,sort_order,created_at,updated_at"
// @Success 200 {array} models.Note "Notes found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body, filter, or query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/notes/search [post]
func (nc *NoteController) SearchNotes(c *gin.Context) {
	// ================ 1. Get search filter from request ================
	var searchReq models.SearchFilter
	if err := common.ParseRequestBody(&searchReq, c); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 3. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(noteSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder1 := fmt.Sprintf("%s ASC", schema.NOTE_SORT_ORDER)
		defaultOrder2 := fmt.Sprintf("%s DESC", schema.NOTE_ID)
		orderByClauses = []*string{&defaultOrder1, &defaultOrder2}
	}

	// ================ 4. Convert filter to SQL condition ================
	where, err := searchReq.ToSqlizer()
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid search filter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 5. Fetch data from database ================
	notes, err := nc.notePeer.Select([]*string{}, where, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 6. Transform data to API model ================
	noteEntities := []*models.Note{}
	if len(notes) > 0 {
		noteEntities = nc.convertToNoteEntities(notes)
	}

	// ================ 7. Send response ================
	common.ResponseSuccess(http.StatusOK, noteEntities, c)
}

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
func (nc *NoteController) GetNote(c *gin.Context) {
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
func (nc *NoteController) CreateNote(c *gin.Context) {
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
func (nc *NoteController) UpdateNote(c *gin.Context) {
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

// DeleteNote @Summary Delete a note
// @Description Delete a specific note
// @Tags notes
// @Param id path int true "Note ID"
// @Success 204 "Note deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid note ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Note not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/notes/{id} [delete]
func (nc *NoteController) DeleteNote(c *gin.Context) {
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

// CountNotes @Summary Count total notes
// @Description Get the total count of notes in the database
// @Tags notes
// @Produce json
// @Success 200 {object} map[string]int64 "Total count of notes"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count notes in database"
// @Router /api/notes/count [get]
func (nc *NoteController) CountNotes(c *gin.Context) {
	// ================ 1. Fetch count from database ================
	count, err := nc.notePeer.Count()
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count notes in database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
