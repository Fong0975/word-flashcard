package models

import "time"

// BackupSummary holds the row counts recorded in a backup file's header when
// the backup was created.
type BackupSummary struct {
	Words     int `json:"words"`
	Questions int `json:"questions"`
	Notes     int `json:"notes"`
}

// BackupFile describes one on-disk backup file inside the backup
// directory, as returned by GET /api/data/backups. Summary is omitted for
// backups created before row counts were recorded in the file header.
type BackupFile struct {
	Name       string         `json:"name"`
	SizeBytes  int64          `json:"size_bytes"`
	ModifiedAt time.Time      `json:"modified_at"`
	Summary    *BackupSummary `json:"summary,omitempty"`
}
