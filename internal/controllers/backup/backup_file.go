package backup

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
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

// BackupFileInfo describes one on-disk backup file found by ListBackupFiles.
type BackupFileInfo struct {
	Path    string
	Name    string
	Size    int64
	ModTime time.Time
}

// ListBackupFiles returns every BackupFilePrefix-prefixed *.json file found
// directly inside dir -- subdirectories and any other file are ignored. A
// missing directory is reported as no files, not an error, since that's
// simply the "no backups yet" state. The result order is unspecified;
// callers that care about ordering (e.g. newest first) must sort it
// themselves.
func ListBackupFiles(dir string) ([]BackupFileInfo, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var files []BackupFileInfo
	for _, entry := range entries {
		if entry.IsDir() || !IsBackupFileName(entry.Name()) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		files = append(files, BackupFileInfo{
			Path:    filepath.Join(dir, entry.Name()),
			Name:    entry.Name(),
			Size:    info.Size(),
			ModTime: info.ModTime(),
		})
	}

	return files, nil
}

// IsBackupFileName reports whether name matches the naming convention
// WriteBackupFile uses (BackupFilePrefix, ending in ".json").
func IsBackupFileName(name string) bool {
	return strings.HasPrefix(name, BackupFilePrefix) && strings.HasSuffix(name, ".json")
}
