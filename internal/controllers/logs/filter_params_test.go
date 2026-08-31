package logs

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestParseFilterParams(t *testing.T) {
	local := func(year, month, day, hour, minute, second, nanosecond int) time.Time {
		return time.Date(year, time.Month(month), day, hour, minute, second, nanosecond, time.Local)
	}

	tests := []struct {
		name       string
		query      string
		wantLevels []string
		wantFrom   *time.Time
		wantTo     *time.Time
		wantErr    bool
	}{
		{name: "no parameters means no constraints", query: ""},
		{
			name:       "a single level",
			query:      "?level=WARN",
			wantLevels: []string{"WARN"},
		},
		{
			name:       "several levels",
			query:      "?level=WARN,ERROR",
			wantLevels: []string{"WARN", "ERROR"},
		},
		{
			name:       "surrounding spaces and blanks are dropped",
			query:      "?level=+WARN+,,ERROR,",
			wantLevels: []string{"WARN", "ERROR"},
		},
		{name: "an empty level parameter imposes no constraint", query: "?level="},
		{
			name:     "an RFC3339 lower bound",
			query:    "?from=2026-08-30T20:44:13Z",
			wantFrom: ptrTime(time.Date(2026, 8, 30, 20, 44, 13, 0, time.UTC)),
		},
		{
			name:     "a timestamp without a zone is read as local time",
			query:    "?from=2026-08-30T20:44:13",
			wantFrom: ptrTime(local(2026, 8, 30, 20, 44, 13, 0)),
		},
		{
			name:     "a date-only lower bound starts at midnight",
			query:    "?from=2026-08-30",
			wantFrom: ptrTime(local(2026, 8, 30, 0, 0, 0, 0)),
		},
		{
			name:   "a date-only upper bound covers the whole day",
			query:  "?to=2026-08-30",
			wantTo: ptrTime(local(2026, 8, 30, 23, 59, 59, int(time.Second-time.Nanosecond))),
		},
		{
			name:   "an explicit upper bound is not stretched",
			query:  "?to=2026-08-30T12:00:00Z",
			wantTo: ptrTime(time.Date(2026, 8, 30, 12, 0, 0, 0, time.UTC)),
		},
		{
			name:       "levels and bounds combine",
			query:      "?level=ERROR&from=2026-08-01&to=2026-08-31",
			wantLevels: []string{"ERROR"},
			wantFrom:   ptrTime(local(2026, 8, 1, 0, 0, 0, 0)),
			wantTo:     ptrTime(local(2026, 8, 31, 23, 59, 59, int(time.Second-time.Nanosecond))),
		},
		{name: "an unparsable lower bound is rejected", query: "?from=yesterday", wantErr: true},
		{name: "an unparsable upper bound is rejected", query: "?to=31/08/2026", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/logs"+tt.query, nil)

			got, err := ParseFilterParams(ctx)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseFilterParams() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}

			if len(got.Levels) != len(tt.wantLevels) {
				t.Fatalf("levels = %v, want %v", got.Levels, tt.wantLevels)
			}
			for i := range tt.wantLevels {
				if got.Levels[i] != tt.wantLevels[i] {
					t.Errorf("level %d = %q, want %q", i, got.Levels[i], tt.wantLevels[i])
				}
			}

			assertBound(t, "From", got.From, tt.wantFrom)
			assertBound(t, "To", got.To, tt.wantTo)
		})
	}
}

func ptrTime(t time.Time) *time.Time { return &t }

func assertBound(t *testing.T, name string, got, want *time.Time) {
	t.Helper()

	switch {
	case want == nil && got != nil:
		t.Errorf("%s = %v, want nil", name, got)
	case want != nil && got == nil:
		t.Errorf("%s = nil, want %v", name, want)
	case want != nil && !got.Equal(*want):
		t.Errorf("%s = %v, want %v", name, got, want)
	}
}
