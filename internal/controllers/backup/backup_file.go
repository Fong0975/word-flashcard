package backup

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// BackupFilePrefix distinguishes a scheduled on-disk backup
// (word-flashcard-backup-<timestamp>.json) from a manually downloaded
// export (word-flashcard-export-<timestamp>.json, see ExportData), so the
// two are easy to tell apart when browsing the backup directory.
const BackupFilePrefix = "word-flashcard-backup-"

// WriteBackupFile builds a full export (see BuildExport) and writes it as
// an indented JSON file inside dir, creating dir if it doesn't already
// exist. It returns the full path of the file just written.
func (bc *Controller) WriteBackupFile(dir string) (string, error) {
	export, err := bc.BuildExport()
	if err != nil {
		return "", fmt.Errorf("failed to build export: %w", err)
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("failed to create backup directory: %w", err)
	}

	filename := fmt.Sprintf("%s%s.json", BackupFilePrefix, time.Now().UTC().Format("20060102-150405"))
	path := filepath.Join(dir, filename)

	data, err := json.MarshalIndent(export, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal export: %w", err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return "", fmt.Errorf("failed to write backup file: %w", err)
	}

	return path, nil
}
