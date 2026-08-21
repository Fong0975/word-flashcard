package backup

import (
	"net/http"
	"os"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
	"word-flashcard/utils/config"

	"github.com/gin-gonic/gin"
)

// TriggerBackup @Summary Trigger an immediate backup
// @Description Writes a new scheduled-style backup file (word-flashcard-backup-*.json) right now; this becomes the newest file, so it delays the next automatic scheduled backup.
// @Tags data
// @Produce json
// @Success 200 {object} models.BackupFile "The newly created backup file"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to write the backup file"
// @Router /api/data/backups [post]
func (bc *Controller) TriggerBackup(c *gin.Context) {
	dir := config.GetOrDefault("BACKUP_DIR", defaultBackupDir)

	path, err := bc.WriteBackupFile(dir)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to write the backup file", models.ErrCodeInternalError, err, c)
		return
	}

	info, err := os.Stat(path)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to read the newly created backup file", models.ErrCodeInternalError, err, c)
		return
	}

	common.ResponseSuccess(http.StatusOK, models.BackupFile{
		Name:       info.Name(),
		SizeBytes:  info.Size(),
		ModifiedAt: info.ModTime(),
	}, c)
}
