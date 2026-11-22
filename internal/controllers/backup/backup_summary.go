package backup

import (
	"encoding/json"
	"os"

	"word-flashcard/internal/models"
)

// summaryKey is the JSON key under which WriteBackupFile stores the row
// counts as the first key of the backup document.
const summaryKey = "summary"

// ReadBackupSummary returns the row counts recorded in the header of the
// backup file at path. It streams the document and stops after the first
// key, so the cost is independent of the file size.
//
// It returns nil when the file has no summary header (a backup created
// before counts were recorded), is empty, is unreadable or is malformed;
// a missing summary must never make listing the backups fail.
func ReadBackupSummary(path string) *models.BackupSummary {
	file, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer file.Close()

	decoder := json.NewDecoder(file)

	if token, err := decoder.Token(); err != nil || token != json.Delim('{') {
		return nil
	}

	token, err := decoder.Token()
	if err != nil {
		return nil
	}
	if key, ok := token.(string); !ok || key != summaryKey {
		return nil
	}

	var summary models.BackupSummary
	if err := decoder.Decode(&summary); err != nil {
		return nil
	}

	return &summary
}
