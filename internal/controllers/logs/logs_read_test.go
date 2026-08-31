package logs

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// TestMarkLogsRead verifies the watermark is persisted, that it clears the
// unread count, and that an unwritable location surfaces as a 500.
func (suite *ControllerTestSuite) TestMarkLogsRead() {
	tests := []struct {
		name       string
		unwritable bool
		wantStatus int
	}{
		{
			name:       "persists the watermark and clears the unread count",
			wantStatus: http.StatusOK,
		},
		{
			name:       "an unwritable state path is reported as an error",
			unwritable: true,
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.SetupTest()
			dir := suite.useFixtureLogs()
			if tt.unwritable {
				// A path whose parent is an existing regular file cannot be
				// created as a directory, so MkdirAll fails.
				suite.T().Setenv("LOG_STATE_FILE_PATH", filepath.Join(dir, "app.log", "state.json"))
			}

			before := time.Now()
			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/logs/read", nil)
			suite.controller.MarkLogsRead(ctx)

			suite.Equal(tt.wantStatus, w.Code)
			if tt.wantStatus != http.StatusOK {
				return
			}

			// The stored watermark must be the moment of the call.
			state, err := LoadReadState(ReadStateFilePath())
			suite.Require().NoError(err)
			suite.False(state.LastReadAt.Before(before))
			suite.False(state.LastReadAt.After(time.Now()))

			// And it must actually clear the indicator.
			unreadRecorder := httptest.NewRecorder()
			unreadCtx, _ := gin.CreateTestContext(unreadRecorder)
			unreadCtx.Request = httptest.NewRequest(http.MethodGet, "/api/logs/unread", nil)
			suite.controller.UnreadLogs(unreadCtx)
			suite.Contains(unreadRecorder.Body.String(), `"count":0`)
		})
	}
}
