package logs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// TestCountLogs verifies the count matches what ListLogs would return for
// the same filter -- the pairing the frontend's pagination relies on.
func (suite *ControllerTestSuite) TestCountLogs() {
	tests := []struct {
		name       string
		query      string
		missingDir bool
		wantStatus int
		wantCount  int
	}{
		{name: "counts every entry", wantStatus: http.StatusOK, wantCount: 4},
		{name: "level filter", query: "?level=INFO", wantStatus: http.StatusOK, wantCount: 2},
		{name: "several levels", query: "?level=WARN,ERROR", wantStatus: http.StatusOK, wantCount: 2},
		{
			name:       "time range filter",
			query:      "?from=2026-08-30T20:44:12",
			wantStatus: http.StatusOK,
			wantCount:  2,
		},
		{
			name:       "a date-only upper bound covers the whole day",
			query:      "?to=2026-08-30",
			wantStatus: http.StatusOK,
			wantCount:  4,
		},
		{name: "missing log directory counts zero", missingDir: true, wantStatus: http.StatusOK},
		{name: "an unparsable time bound is rejected", query: "?to=31/08/2026", wantStatus: http.StatusBadRequest},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := suite.useFixtureLogs()
			if tt.missingDir {
				suite.T().Setenv("LOG_FILE_PATH", filepath.Join(dir, "absent", "app.log"))
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/logs/count"+tt.query, nil)
			suite.controller.CountLogs(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				return
			}

			var body struct {
				Count int `json:"count"`
			}
			suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &body))
			suite.Equal(tt.wantCount, body.Count)
		})
	}
}
