package logs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// TestListLogs covers paging, filtering and the parameter-validation
// branches of the ListLogs handler against the shared fixture log set.
func (suite *ControllerTestSuite) TestListLogs() {
	tests := []struct {
		name         string
		query        string
		missingDir   bool
		wantStatus   int
		wantMessages []string
		wantIDs      []int
	}{
		{
			name:         "returns every entry newest first",
			wantStatus:   http.StatusOK,
			wantMessages: []string{"D", "C", "B", "A"},
			wantIDs:      []int{1, 2, 3, 4},
		},
		{
			name:         "first page",
			query:        "?limit=2",
			wantStatus:   http.StatusOK,
			wantMessages: []string{"D", "C"},
			wantIDs:      []int{1, 2},
		},
		{
			name:         "second page continues the sequence",
			query:        "?limit=2&offset=2",
			wantStatus:   http.StatusOK,
			wantMessages: []string{"B", "A"},
			wantIDs:      []int{3, 4},
		},
		{
			name:         "level filter",
			query:        "?level=WARN,ERROR",
			wantStatus:   http.StatusOK,
			wantMessages: []string{"D", "B"},
			wantIDs:      []int{1, 2},
		},
		{
			name:         "time range filter",
			query:        "?from=2026-08-30T20:44:11&to=2026-08-30T20:44:12",
			wantStatus:   http.StatusOK,
			wantMessages: []string{"C", "B"},
		},
		{
			name:         "missing log directory returns an empty list",
			missingDir:   true,
			wantStatus:   http.StatusOK,
			wantMessages: []string{},
		},
		{
			name:       "an invalid limit is rejected",
			query:      "?limit=abc",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "an out-of-range limit is rejected",
			query:      "?limit=5000",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "a negative offset is rejected",
			query:      "?offset=-1",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "an unparsable time bound is rejected",
			query:      "?from=yesterday",
			wantStatus: http.StatusBadRequest,
		},
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
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/logs"+tt.query, nil)
			suite.controller.ListLogs(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				return
			}

			var entries []models.LogEntry
			suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &entries))

			gotMessages := make([]string, len(entries))
			for i, entry := range entries {
				gotMessages[i] = entry.Message
			}
			suite.Equal(tt.wantMessages, gotMessages)

			for i, wantID := range tt.wantIDs {
				suite.Equal(wantID, entries[i].ID)
			}
		})
	}
}
