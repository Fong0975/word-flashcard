package logs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// TestDownloadLogs covers the three shapes of the download: a zip when the
// fixture's rotated sibling is present, the raw file when it is not, and a
// 404 when there is nothing to send.
func (suite *ControllerTestSuite) TestDownloadLogs() {
	const rotatedName = "app-2026-08-30T10-00-00.000.log"

	tests := []struct {
		name            string
		removeRotated   bool
		missingDir      bool
		wantStatus      int
		wantContentType string
		wantDisposition *regexp.Regexp
		wantZipped      []string
	}{
		{
			name:            "several log files are sent as a zip archive",
			wantStatus:      http.StatusOK,
			wantContentType: "application/zip",
			wantDisposition: regexp.MustCompile(`^attachment; filename="app-logs-\d{8}-\d{6}\.zip"$`),
			wantZipped:      []string{"app.log", rotatedName},
		},
		{
			name:            "a lone log file is sent as plain text",
			removeRotated:   true,
			wantStatus:      http.StatusOK,
			wantContentType: "text/plain; charset=utf-8",
			wantDisposition: regexp.MustCompile(`^attachment; filename="app\.log"$`),
		},
		{
			name:       "missing log directory is reported as not found",
			missingDir: true,
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := suite.useFixtureLogs()
			if tt.removeRotated {
				suite.Require().NoError(os.Remove(filepath.Join(dir, rotatedName)))
			}
			if tt.missingDir {
				suite.T().Setenv("LOG_FILE_PATH", filepath.Join(dir, "absent", "app.log"))
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/logs/download", nil)
			// Mirrors JSONMiddleware, which the handler has to override.
			ctx.Header("Content-Type", "application/json")
			suite.controller.DownloadLogs(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				var body models.ErrorResponse
				suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &body))
				suite.Equal(models.ErrCodeNotFound, body.Code)
				return
			}

			suite.Equal(tt.wantContentType, w.Header().Get("Content-Type"))
			suite.Regexp(tt.wantDisposition, w.Header().Get("Content-Disposition"))

			if tt.wantZipped == nil {
				want, err := os.ReadFile(filepath.Join(dir, "app.log"))
				suite.Require().NoError(err)
				suite.Equal(string(want), w.Body.String())
				return
			}

			entries := readArchive(suite.T(), w.Body.Bytes())
			suite.Len(entries, len(tt.wantZipped))
			for _, name := range tt.wantZipped {
				want, err := os.ReadFile(filepath.Join(dir, name))
				suite.Require().NoError(err)
				suite.Equal(string(want), entries[name])
			}
		})
	}
}
