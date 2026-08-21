package backup

import (
	"net/http"
	"sort"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
	"word-flashcard/utils/config"

	"github.com/gin-gonic/gin"
)

// defaultBackupDir mirrors internal/scheduler's default -- both must point at
// the same directory since the scheduler is what actually writes the files
// this endpoint lists.
const defaultBackupDir = "backups"

// ListBackups @Summary List backup files
// @Description List every scheduled backup file (word-flashcard-backup-*.json) directly inside the backup directory, sorted by name descending (newest first)
// @Tags data
// @Produce json
// @Success 200 {array} models.BackupFile "List of backup files"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to read the backup directory"
// @Router /api/data/backups [get]
func (bc *Controller) ListBackups(c *gin.Context) {
	dir := config.GetOrDefault("BACKUP_DIR", defaultBackupDir)

	backupFiles, err := ListBackupFiles(dir)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to read the backup directory", models.ErrCodeInternalError, err, c)
		return
	}

	files := make([]models.BackupFile, len(backupFiles))
	for i, f := range backupFiles {
		files[i] = models.BackupFile{
			Name:       f.Name,
			SizeBytes:  f.Size,
			ModifiedAt: f.ModTime,
		}
	}

	// Sorted by name descending -- the name embeds a yyyyMMdd-HHmmss
	// timestamp (see BackupFilePrefix), so this also puts the newest
	// backup first without relying on filesystem mtimes.
	sort.Slice(files, func(i, j int) bool {
		return files[i].Name > files[j].Name
	})

	common.ResponseSuccess(http.StatusOK, files, c)
}
