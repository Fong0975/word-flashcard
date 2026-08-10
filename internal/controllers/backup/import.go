package backup

import (
	"net/http"

	"word-flashcard/data/peers"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ImportData @Summary Restore the entire database from an export
// @Description Wipes every table and rewrites it from the uploaded snapshot, preserving each row's original id/created_at/updated_at. Destructive: all existing data is permanently replaced.
// @Tags data
// @Accept json
// @Produce json
// @Param export body models.DataExport true "Full database snapshot to restore"
// @Success 200 {object} models.ImportSummary "Row counts written per table"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid or incomplete request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to restore data into database"
// @Router /api/data/import [post]
func (bc *Controller) ImportData(c *gin.Context) {
	// ================ 1. Parse request body ================
	// An empty body is rejected outright rather than falling through to
	// ParseRequestBody's "empty body is a no-op" behavior (meant for partial
	// update endpoints): here it would silently wipe every table with
	// nothing to restore, which is never what an empty request meant.
	if c.Request.ContentLength == 0 {
		common.ResponseError(http.StatusBadRequest, "Request body is required", models.ErrCodeInvalidRequest, nil, c)
		return
	}

	var export models.DataExport
	if err := common.ParseRequestBody(&export, c); err != nil {
		common.RespondInvalidBody(err, c)
		return
	}

	// ================ 2. Validate required fields before touching the database ================
	if err := validateExport(&export); err != nil {
		common.ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 3. Restore every table inside a single transaction ================
	payload := &peers.RestorePayload{
		Words:              export.Words,
		WordDefinitions:    export.WordDefinitions,
		Questions:          export.Questions,
		QuestionAnswerLogs: export.QuestionAnswerLogs,
		WordPracticeLogs:   export.WordPracticeLogs,
		Notes:              export.Notes,
	}
	if err := bc.backupPeer.RestoreAll(payload); err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to restore data into database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Send response ================
	summary := models.ImportSummary{
		Words:              len(export.Words),
		WordDefinitions:    len(export.WordDefinitions),
		Questions:          len(export.Questions),
		QuestionAnswerLogs: len(export.QuestionAnswerLogs),
		WordPracticeLogs:   len(export.WordPracticeLogs),
		Notes:              len(export.Notes),
	}
	common.ResponseSuccess(http.StatusOK, summary, c)
}
