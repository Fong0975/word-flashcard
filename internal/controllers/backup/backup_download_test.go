package backup

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// TestDownloadBackup covers every branch of the DownloadBackup handler: a
// successful download of an existing file, rejecting a path-traversal
// attempt and a filename that doesn't match the expected pattern (both
// before ever touching the filesystem), and a valid-format name that has no
// corresponding file on disk.
func (suite *ControllerTestSuite) TestDownloadBackup() {
	tests := []struct {
		name       string
		paramValue string
		setup      func(dir string)
		wantStatus int
		wantBody   []byte
	}{
		{
			name:       "existing backup file downloads successfully",
			paramValue: "word-flashcard-backup-20260101-000000.json",
			setup: func(dir string) {
				suite.Require().NoError(os.WriteFile(
					filepath.Join(dir, "word-flashcard-backup-20260101-000000.json"),
					[]byte(`{"exported_at":"2026-01-01T00:00:00Z"}`),
					0o644,
				))
			},
			wantStatus: http.StatusOK,
			wantBody:   []byte(`{"exported_at":"2026-01-01T00:00:00Z"}`),
		},
		{
			name:       "rejects a name containing path traversal characters",
			paramValue: "../../../etc/passwd",
			setup:      func(dir string) {},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "rejects a name that doesn't match the backup filename pattern",
			paramValue: "not-a-backup.json",
			setup:      func(dir string) {},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "valid-format name that doesn't exist on disk returns 404",
			paramValue: "word-flashcard-backup-20260101-000000.json",
			setup:      func(dir string) {},
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := suite.T().TempDir()
			tt.setup(dir)
			suite.T().Setenv("BACKUP_DIR", dir)

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/data/backups/"+tt.paramValue, nil)
			ctx.Params = gin.Params{{Key: "name", Value: tt.paramValue}}
			suite.controller.DownloadBackup(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantBody != nil {
				suite.Equal(tt.wantBody, w.Body.Bytes())
				suite.Contains(w.Header().Get("Content-Disposition"), tt.paramValue)
			}
		})
	}
}
