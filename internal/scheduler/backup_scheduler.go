// Package scheduler runs periodic background jobs that don't belong to any
// single HTTP request -- currently just the automatic database backup.
package scheduler

import (
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"word-flashcard/internal/controllers/backup"
	"word-flashcard/utils/config"
)

const (
	defaultBackupDir            = "backups"
	defaultBackupIntervalHours  = 72 // how old the newest backup must be before a new one is due
	defaultCheckIntervalHours   = 24 // how often to re-check the above
	defaultBackupRetentionCount = 10 // how many backup files to keep

	// minCheckInterval guards against a misconfigured (zero or negative)
	// BACKUP_CHECK_INTERVAL_HOURS: time.NewTicker panics on a non-positive
	// duration, which would take down the whole process since this runs in
	// its own goroutine outside gin's request-scoped RecoveryMiddleware.
	minCheckInterval = time.Minute
)

// StartBackupScheduler runs a full-database backup once immediately, then
// re-checks on every tick of the configured check interval whether the
// newest backup file is older than the configured backup interval, writing
// a new one (and pruning old ones) whenever it is. It blocks until stop is
// closed, so callers should run it in its own goroutine.
//
// The immediate startup run is what actually guarantees "at least every N
// days" across restarts: it reads the newest backup file's real mtime from
// disk, which persists across restarts, unlike an in-memory ticker that
// would reset to zero every time the process restarts.
func StartBackupScheduler(stop <-chan struct{}) {
	// A panic here must never take down the HTTP server -- this goroutine
	// isn't covered by gin's RecoveryMiddleware.
	defer func() {
		if r := recover(); r != nil {
			slog.Error("Backup scheduler panicked and stopped", "panic", r)
		}
	}()

	dir := config.GetOrDefault("BACKUP_DIR", defaultBackupDir)
	interval := time.Duration(config.GetOrDefaultInt("BACKUP_INTERVAL_HOURS", defaultBackupIntervalHours)) * time.Hour
	checkInterval := time.Duration(config.GetOrDefaultInt("BACKUP_CHECK_INTERVAL_HOURS", defaultCheckIntervalHours)) * time.Hour
	retain := config.GetOrDefaultInt("BACKUP_RETENTION_COUNT", defaultBackupRetentionCount)

	if checkInterval <= 0 {
		slog.Warn("BACKUP_CHECK_INTERVAL_HOURS resolved to a non-positive duration; falling back to the minimum",
			"resolved", checkInterval.String(), "minimum", minCheckInterval.String())
		checkInterval = minCheckInterval
	}

	bc, err := newBackupController()
	if err != nil {
		slog.Error("Backup scheduler failed to start: could not connect to the database", "error", err)
		return
	}

	slog.Info("Backup scheduler started", "dir", dir, "backup_interval", interval.String(), "check_interval", checkInterval.String(), "retain", retain)

	runBackupIfDue(bc, dir, interval, retain)

	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			runBackupIfDue(bc, dir, interval, retain)
		case <-stop:
			slog.Info("Backup scheduler stopped")
			return
		}
	}
}

// newBackupController wires up the same real peers/controller that
// internal/routers/api.go builds for the HTTP /api/data/export|import
// routes. The connections it opens are held for the scheduler goroutine's
// entire lifetime and reused for every check -- calling GetReelPeers()
// again on every tick would open a brand new connection pool per peer each
// time (see data/peers/base.go: NewBasePeer never reuses a shared pool) and
// leak connections for as long as the process stays up.
func newBackupController() (*backup.Controller, error) {
	wordPeer, wordDefinitionPeer, questionPeer, questionAnswerLogPeer, wordPracticeLogPeer, notePeer, backupPeer, err := backup.GetReelPeers()
	if err != nil {
		return nil, err
	}

	return backup.New(
		wordPeer,
		wordDefinitionPeer,
		questionPeer,
		questionAnswerLogPeer,
		wordPracticeLogPeer,
		notePeer,
		backupPeer,
	), nil
}

// runBackupIfDue writes a new backup file (and prunes old ones) if the
// newest existing backup in dir is older than interval, otherwise it logs
// that the check was skipped. Every failure is only logged -- a failed
// backup attempt must never affect the running server.
func runBackupIfDue(bc *backup.Controller, dir string, interval time.Duration, retain int) {
	due, lastBackupAge, err := isBackupDue(dir, interval)
	if err != nil {
		slog.Error("Backup schedule check failed", "error", err, "dir", dir)
		return
	}
	if !due {
		slog.Info("Scheduled backup skipped", "reason", "last backup is still recent", "dir", dir, "last_backup_age", lastBackupAge.String())
		return
	}

	path, err := bc.WriteBackupFile(dir)
	if err != nil {
		slog.Error("Scheduled backup failed", "error", err, "dir", dir)
		return
	}
	slog.Info("Scheduled backup completed", "path", path)

	if err := pruneOldBackups(dir, retain); err != nil {
		slog.Error("Failed to prune old backup files", "error", err, "dir", dir)
	}
}

// isBackupDue reports whether dir's most recently modified backup file
// (see backup.BackupFilePrefix) is older than interval. A missing
// directory or a directory with no backup files yet is always due.
func isBackupDue(dir string, interval time.Duration) (due bool, lastBackupAge time.Duration, err error) {
	newest, found, err := newestBackupModTime(dir)
	if err != nil {
		return false, 0, err
	}
	if !found {
		return true, 0, nil
	}

	age := time.Since(newest)
	return age >= interval, age, nil
}

// pruneOldBackups deletes every backup file in dir beyond the retain most
// recent ones. retain <= 0 disables pruning entirely.
func pruneOldBackups(dir string, retain int) error {
	if retain <= 0 {
		return nil
	}

	files, err := listBackupFiles(dir)
	if err != nil {
		return err
	}
	if len(files) <= retain {
		return nil
	}

	// Newest first, so files[retain:] is exactly what should be removed.
	sort.Slice(files, func(i, j int) bool {
		return files[i].modTime.After(files[j].modTime)
	})

	for _, f := range files[retain:] {
		if err := os.Remove(f.path); err != nil {
			slog.Error("Failed to remove old backup file", "error", err, "path", f.path)
			continue
		}
		slog.Info("Pruned old backup file", "path", f.path)
	}

	return nil
}

type backupFileInfo struct {
	path    string
	modTime time.Time
}

// listBackupFiles returns every backup.BackupFilePrefix-prefixed *.json
// file directly inside dir. A missing directory is reported as no files,
// not an error -- that's simply the "no backups yet" state.
func listBackupFiles(dir string) ([]backupFileInfo, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var files []backupFileInfo
	for _, entry := range entries {
		if entry.IsDir() || !isBackupFileName(entry.Name()) {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		files = append(files, backupFileInfo{
			path:    filepath.Join(dir, entry.Name()),
			modTime: info.ModTime(),
		})
	}

	return files, nil
}

// newestBackupModTime returns the modification time of the most recently
// modified backup file in dir, and whether any backup file was found at all.
func newestBackupModTime(dir string) (newest time.Time, found bool, err error) {
	files, err := listBackupFiles(dir)
	if err != nil {
		return time.Time{}, false, err
	}

	for _, f := range files {
		if !found || f.modTime.After(newest) {
			newest = f.modTime
			found = true
		}
	}

	return newest, found, nil
}

func isBackupFileName(name string) bool {
	return strings.HasPrefix(name, backup.BackupFilePrefix) && strings.HasSuffix(name, ".json")
}
