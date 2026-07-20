package word

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"time"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGetWordsTrend tests the GetWordsTrend handler, using a 3-day window
// (?days=3) so the zero-filled and populated days are easy to hand-compute:
// today has two red->green log entries (fully improved, avg score 100), the
// previous day has one yellow->yellow entry (no improvement, avg score 50),
// and the day before that has no entries at all (zero-filled).
func (suite *ControllerTestSuite) TestGetWordsTrend() {
	testWordID := 1
	now := common.NowInReportTimeZone()
	today := time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, now.Location())
	yesterday := today.AddDate(0, 0, -1)

	todayKey := today.Format("2006-01-02")
	yesterdayKey := yesterday.Format("2006-01-02")
	twoDaysAgoKey := today.AddDate(0, 0, -2).Format("2006-01-02")

	logID1, logID2, logID3 := 1, 2, 3
	green, yellow, red := "green", "yellow", "red"

	sampleLogs := []*dbModels.WordPracticeLog{
		{Id: &logID1, WordId: &testWordID, Familiarity: &green, PreviousFamiliarity: &red, CreatedAt: &today},
		{Id: &logID2, WordId: &testWordID, Familiarity: &green, PreviousFamiliarity: &red, CreatedAt: &today},
		{Id: &logID3, WordId: &testWordID, Familiarity: &yellow, PreviousFamiliarity: &yellow, CreatedAt: &yesterday},
	}

	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(sampleLogs, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/trend?days=3", nil)
	suite.controller.GetWordsTrend(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expected := []models.WordTrendPoint{
		{Date: twoDaysAgoKey, PracticeCount: 0, ImprovementRate: 0, AvgFamiliarityScore: 0},
		{Date: yesterdayKey, PracticeCount: 1, ImprovementRate: 0, AvgFamiliarityScore: 50},
		{Date: todayKey, PracticeCount: 2, ImprovementRate: 100, AvgFamiliarityScore: 100},
	}
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetWordsTrendBucketsByReportTimeZone tests that GetWordsTrend buckets a
// practice log by its calendar day in common.ReportTimeZone rather than the
// UTC calendar day the timestamp is stored/parsed in. The log is placed at
// 00:30 in ReportTimeZone converted to its equivalent UTC instant, which for
// a timezone ahead of UTC falls on the previous UTC calendar day -- exactly
// the mismatch that caused trend charts to bucket a practice into the wrong
// day.
func (suite *ControllerTestSuite) TestGetWordsTrendBucketsByReportTimeZone() {
	testWordID := 1
	now := common.NowInReportTimeZone()
	dateKeys := common.DailyDateKeys(3, now)

	reportMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 30, 0, 0, now.Location())
	logTime := reportMidnight.UTC()

	logID := 1
	green, red := "green", "red"
	sampleLogs := []*dbModels.WordPracticeLog{
		{Id: &logID, WordId: &testWordID, Familiarity: &green, PreviousFamiliarity: &red, CreatedAt: &logTime},
	}

	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(sampleLogs, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/trend?days=3", nil)
	suite.controller.GetWordsTrend(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expected := []models.WordTrendPoint{
		{Date: dateKeys[0], PracticeCount: 0, ImprovementRate: 0, AvgFamiliarityScore: 0},
		{Date: dateKeys[1], PracticeCount: 0, ImprovementRate: 0, AvgFamiliarityScore: 0},
		{Date: dateKeys[2], PracticeCount: 1, ImprovementRate: 100, AvgFamiliarityScore: 100},
	}
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetWordsTrendInvalidDays tests that GetWordsTrend rejects a days value outside 1-90.
func (suite *ControllerTestSuite) TestGetWordsTrendInvalidDays() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/trend?days=91", nil)
	suite.controller.GetWordsTrend(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}
