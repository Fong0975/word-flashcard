package backup

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// TestListBackups covers every branch of the ListBackups handler: no backup
// directory yet, and a directory containing a mix of matching and
// non-matching files (verifying name-descending ordering -- deliberately
// using a mismatched mtime to prove sorting follows the name, not the
// filesystem mtime -- and correct field mapping). The filesystem-error
// branch (a 500 from ListBackupFiles) isn't covered here because
// os.ReadDir's behavior against a path that's actually a plain file isn't
// reliably an error across platforms (observed to succeed with zero
// entries on Windows) -- there's no injectable filesystem seam to force
// that error deterministically.
func (suite *ControllerTestSuite) TestListBackups() {
	older := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	newer := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name       string
		setupDir   func() string
		wantStatus int
		wantNames  []string // expected order: name descending
	}{
		{
			name:       "missing backup directory returns an empty list",
			setupDir:   func() string { return filepath.Join(suite.T().TempDir(), "does-not-exist") },
			wantStatus: http.StatusOK,
			wantNames:  []string{},
		},
		{
			name: "mixed directory returns only matching files, sorted by name descending",
			setupDir: func() string {
				dir := suite.T().TempDir()
				// The mtimes are deliberately the opposite of the names'
				// chronological order, so a passing test proves sorting
				// follows the name, not the mtime.
				suite.writeBackupFile(filepath.Join(dir, BackupFilePrefix+"20240101-000000.json"), newer)
				suite.writeBackupFile(filepath.Join(dir, BackupFilePrefix+"20240115-000000.json"), older)
				suite.writeBackupFile(filepath.Join(dir, "word-flashcard-export-20240101-000000.json"), newer)
				suite.writeBackupFile(filepath.Join(dir, "local", BackupFilePrefix+"20240120-000000.json"), newer)
				return dir
			},
			wantStatus: http.StatusOK,
			wantNames: []string{
				BackupFilePrefix + "20240115-000000.json",
				BackupFilePrefix + "20240101-000000.json",
			},
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := tt.setupDir()
			suite.T().Setenv("BACKUP_DIR", dir)

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/data/backups", nil)
			suite.controller.ListBackups(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				return
			}

			var files []struct {
				Name       string    `json:"name"`
				SizeBytes  int64     `json:"size_bytes"`
				ModifiedAt time.Time `json:"modified_at"`
			}
			suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &files))

			gotNames := make([]string, len(files))
			for i, f := range files {
				gotNames[i] = f.Name
				suite.Greater(f.SizeBytes, int64(0))
			}
			suite.Equal(tt.wantNames, gotNames)
		})
	}
}

// writeBackupFile writes a minimal backup file at path with an explicit
// modification time, so tests can control ordering deterministically instead
// of relying on real-time gaps between file creations.
func (suite *ControllerTestSuite) writeBackupFile(path string, modTime time.Time) {
	suite.Require().NoError(os.MkdirAll(filepath.Dir(path), 0o755))
	suite.Require().NoError(os.WriteFile(path, []byte("{}"), 0o644))
	suite.Require().NoError(os.Chtimes(path, modTime, modTime))
}
