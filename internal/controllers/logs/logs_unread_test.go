package logs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// TestUnreadLogs covers the watermark and notify-level interaction, plus
// the deliberate degradation when the state file cannot be parsed.
func (suite *ControllerTestSuite) TestUnreadLogs() {
	// The fixture's newest entry is 20:44:13; these bracket it.
	beforeAll := "2026-08-30T20:44:09"
	midway := "2026-08-30T20:44:11"
	afterAll := "2026-08-30T20:44:59"

	tests := []struct {
		name         string
		notifyLevel  string
		stateContent string
		noStateFile  bool
		wantCount    int
	}{
		{
			name:        "no state file means everything is unread",
			noStateFile: true,
			wantCount:   2, // D(WARN) and B(ERROR) are at or above WARN
		},
		{
			name:         "a watermark before every entry",
			stateContent: watermarkJSON(beforeAll),
			wantCount:    2,
		},
		{
			name:         "a watermark midway only counts newer entries",
			stateContent: watermarkJSON(midway),
			wantCount:    1, // only D(WARN); B(ERROR) is at the watermark
		},
		{
			name:         "a watermark after every entry clears the count",
			stateContent: watermarkJSON(afterAll),
			wantCount:    0,
		},
		{
			name:         "a stricter notify level excludes warnings",
			notifyLevel:  LevelError,
			stateContent: watermarkJSON(beforeAll),
			wantCount:    1, // only B(ERROR)
		},
		{
			name:         "a permissive notify level counts everything",
			notifyLevel:  LevelDebug,
			stateContent: watermarkJSON(beforeAll),
			wantCount:    4,
		},
		{
			name:         "a malformed state file degrades to everything unread",
			stateContent: "not json",
			wantCount:    2,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := suite.useFixtureLogs()
			suite.T().Setenv("LOG_NOTIFY_LEVEL", tt.notifyLevel)

			if !tt.noStateFile {
				statePath := filepath.Join(dir, "state.json")
				suite.Require().NoError(os.WriteFile(statePath, []byte(tt.stateContent), 0o644))
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/logs/unread", nil)
			suite.controller.UnreadLogs(ctx)

			suite.Equal(http.StatusOK, w.Code)

			var body struct {
				Count int `json:"count"`
			}
			suite.Require().NoError(json.Unmarshal(w.Body.Bytes(), &body))
			suite.Equal(tt.wantCount, body.Count)
		})
	}
}

// watermarkJSON renders a state file holding the given local wall-clock
// time, matching how log timestamps are parsed.
func watermarkJSON(localTime string) string {
	parsed, err := time.ParseInLocation("2006-01-02T15:04:05", localTime, time.Local)
	if err != nil {
		panic(err)
	}

	data, err := json.Marshal(ReadState{LastReadAt: parsed})
	if err != nil {
		panic(err)
	}

	return string(data)
}
