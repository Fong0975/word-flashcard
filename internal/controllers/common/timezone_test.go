package common

import (
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

// TimezoneTestSuite is a test suite for the ReportTimeZone helper functions.
type TimezoneTestSuite struct {
	suite.Suite
}

// TestTimezoneTestSuite runs the TimezoneTestSuite
func TestTimezoneTestSuite(t *testing.T) {
	suite.Run(t, new(TimezoneTestSuite))
}

// TestNowInReportTimeZone tests that NowInReportTimeZone returns the current
// instant located in whatever time.LoadLocation(ReportTimeZone) resolves to,
// rather than a hardcoded zone name, so it stays correct if ReportTimeZone is
// ever repointed at a different zone.
func (suite *TimezoneTestSuite) TestNowInReportTimeZone() {
	loc, err := time.LoadLocation(ReportTimeZone)
	suite.Require().NoError(err)

	before := time.Now().In(loc)
	got := NowInReportTimeZone()
	after := time.Now().In(loc)

	suite.Equal(loc.String(), got.Location().String())
	suite.False(got.Before(before))
	suite.False(got.After(after))
}

// TestReportDateKey tests ReportDateKey across a timestamp that lands on the
// same calendar day in both UTC and ReportTimeZone, and timestamps straddling
// the UTC/ReportTimeZone day boundary -- the exact discrepancy that caused
// trend charts to bucket a practice log into the wrong day.
func (suite *TimezoneTestSuite) TestReportDateKey() {
	tests := []struct {
		name     string
		input    time.Time
		expected string
	}{
		{
			name:     "UTC and report timezone agree on the calendar day",
			input:    time.Date(2026, 7, 20, 5, 31, 44, 0, time.UTC),
			expected: "2026-07-20",
		},
		{
			name:     "UTC late evening rolls to the next report-timezone day",
			input:    time.Date(2026, 7, 19, 21, 31, 44, 0, time.UTC),
			expected: "2026-07-20",
		},
		{
			name:     "UTC just before its own midnight stays on the day it started",
			input:    time.Date(2026, 7, 19, 15, 59, 59, 0, time.UTC),
			expected: "2026-07-19",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			suite.Equal(tt.expected, ReportDateKey(tt.input))
		})
	}
}
