package models

import "time"

// BackupFile describes one on-disk backup file inside the backup
// directory, as returned by GET /api/data/backups.
type BackupFile struct {
	Name       string    `json:"name"`
	SizeBytes  int64     `json:"size_bytes"`
	ModifiedAt time.Time `json:"modified_at"`
}
