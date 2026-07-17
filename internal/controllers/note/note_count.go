package note

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// CountNotes @Summary Count total notes
// @Description Get the total count of notes in the database
// @Tags notes
// @Produce json
// @Success 200 {object} map[string]int64 "Total count of notes"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count notes in database"
// @Router /api/notes/count [get]
func (nc *Controller) CountNotes(c *gin.Context) {
	// ================ 1. Fetch count from database ================
	count, err := nc.notePeer.Count()
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count notes in database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}
