package common

import (
	"testing"
	"time"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/suite"
)

// StatsTestSuite is a test suite for shared statistics helper functions
type StatsTestSuite struct {
	suite.Suite
}

// TestStatsTestSuite runs the StatsTestSuite
func TestStatsTestSuite(t *testing.T) {
	suite.Run(t, new(StatsTestSuite))
}

// TestNiceCeil tests the niceCeil function with a typical float in the middle of a nice-number interval.
func (suite *StatsTestSuite) TestNiceCeil() {
	suite.Equal(50, niceCeil(46.8))
}

// TestPracticeCountBoundaries tests the practiceCountBoundaries function with a mid-range max value.
func (suite *StatsTestSuite) TestPracticeCountBoundaries() {
	result := practiceCountBoundaries(1000)
	suite.Equal([]int{5, 20, 50, 200, 500, 1001}, result)
}

// TestBuildPracticeCountBuckets tests the BuildPracticeCountBuckets function with a small max value
// that triggers the individual-integer-step path, verifying both labels and counts.
func (suite *StatsTestSuite) TestBuildPracticeCountBuckets() {
	counts := []int{0, 1, 2, 3, 4, 5, 6, 6}
	result := BuildPracticeCountBuckets(counts)

	expected := []models.PracticeCountBucket{
		{Range: "0", Count: 1},
		{Range: "1", Count: 1},
		{Range: "2", Count: 1},
		{Range: "3", Count: 1},
		{Range: "4", Count: 1},
		{Range: "5", Count: 1},
		{Range: "6+", Count: 2},
	}
	suite.Equal(expected, result)
}

// TestDailyDateKeys tests DailyDateKeys with a fixed now, verifying the keys
// are ascending and end at now's calendar day.
func (suite *StatsTestSuite) TestDailyDateKeys() {
	now := time.Date(2026, 7, 14, 15, 30, 0, 0, time.UTC)
	result := DailyDateKeys(3, now)

	expected := []string{"2026-07-12", "2026-07-13", "2026-07-14"}
	suite.Equal(expected, result)
}

// TestTrendWindowStart tests that TrendWindowStart lands on 00:00 in
// ReportTimeZone of the oldest trend day, regardless of now's time of day or
// the timezone now is expressed in, so logs earlier in that day are included.
func (suite *StatsTestSuite) TestTrendWindowStart() {
	loc, err := time.LoadLocation(ReportTimeZone)
	suite.Require().NoError(err)

	tests := []struct {
		name     string
		days     int
		now      time.Time
		expected time.Time
	}{
		{
			name:     "mid-morning now is truncated to the oldest day's midnight",
			days:     30,
			now:      time.Date(2026, 10, 23, 10, 51, 31, 0, loc),
			expected: time.Date(2026, 9, 24, 0, 0, 0, 0, loc),
		},
		{
			name:     "single day window starts at today's midnight",
			days:     1,
			now:      time.Date(2026, 10, 23, 23, 59, 59, 0, loc),
			expected: time.Date(2026, 10, 23, 0, 0, 0, 0, loc),
		},
		{
			name:     "window crossing a month boundary",
			days:     3,
			now:      time.Date(2026, 3, 1, 8, 0, 0, 0, loc),
			expected: time.Date(2026, 2, 27, 0, 0, 0, 0, loc),
		},
		{
			name:     "UTC now is bucketed by its report-timezone calendar day",
			days:     2,
			now:      time.Date(2026, 10, 22, 18, 30, 0, 0, time.UTC),
			expected: time.Date(2026, 10, 22, 0, 0, 0, 0, loc),
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			got := TrendWindowStart(tt.days, tt.now)
			suite.True(tt.expected.Equal(got), "expected %v, got %v", tt.expected, got)
			suite.Equal(DailyDateKeys(tt.days, tt.now.In(loc))[0], ReportDateKey(got))
		})
	}
}

// TestRound1 tests Round1 across a fractional value, an already-round value,
// and a negative value.
func (suite *StatsTestSuite) TestRound1() {
	suite.Equal(33.3, Round1(33.333))
	suite.Equal(10.0, Round1(10.0))
	suite.Equal(-2.5, Round1(-2.46))
}
