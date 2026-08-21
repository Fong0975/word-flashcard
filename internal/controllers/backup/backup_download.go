package backup

import (
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
	"word-flashcard/utils/config"

	"github.com/gin-gonic/gin"
)

// backupFileNameRE is deliberately stricter than IsBackupFileName (which
// only checks HasPrefix/HasSuffix, so e.g.
// "word-flashcard-backup-../../etc/passwd.json" would pass it). Only digits
// and hyphens are allowed between the prefix and ".json", so no "/", "\", or
// ".." can ever reach filepath.Join below -- this is what prevents path
// traversal via the :name URL parameter.
var backupFileNameRE = regexp.MustCompile(`^` + BackupFilePrefix + `\d{8}-\d{6}\.json$`)

// DownloadBackup @Summary Download a single backup file
// @Description Downloads one backup file's raw contents by its exact file name, with a Content-Disposition attachment header.
// @Tags data
// @Produce application/json
// @Param name path string true "Backup file name, e.g. word-flashcard-backup-20260101-000000.json"
// @Success 200 {file} file "Raw backup file contents"
// @Failure 400 {object} models.ErrorResponse "Invalid request - name is not a valid backup file name"
// @Failure 404 {object} models.ErrorResponse "Not found - no backup file with that name exists"
// @Router /api/data/backups/{name} [get]
func (bc *Controller) DownloadBackup(c *gin.Context) {
	name := c.Param("name")
	if !backupFileNameRE.MatchString(name) {
		common.ResponseError(http.StatusBadRequest, "Invalid backup file name", models.ErrCodeInvalidRequest, nil, c)
		return
	}

	dir := config.GetOrDefault("BACKUP_DIR", defaultBackupDir)
	path := filepath.Join(dir, name)

	if _, err := os.Stat(path); err != nil {
		common.ResponseError(http.StatusNotFound, "Backup file not found", models.ErrCodeNotFound, err, c)
		return
	}

	c.FileAttachment(path, name)
}
