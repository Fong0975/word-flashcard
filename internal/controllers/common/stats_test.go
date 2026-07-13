package common

import (
	"testing"
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
