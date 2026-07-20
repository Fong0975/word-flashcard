package question

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

// TestGetQuestionsTrend tests the GetQuestionsTrend handler. It uses a small
// 3-day window so the expected zero-filled output is easy to hand-compute:
// 3 logs on the oldest day of the window (2 correct, 1 incorrect) →
// accuracy_rate = round1(2*100/3) = 66.7, the other two days stay zero-filled.
func (suite *ControllerTestSuite) TestGetQuestionsTrend() {
	testID := 1
	now := common.NowInReportTimeZone()
	dateKeys := common.DailyDateKeys(3, now)
	oldestDay, err := time.Parse("2006-01-02", dateKeys[0])
	assert.NoError(suite.T(), err)
	logTime := oldestDay.Add(12 * time.Hour)

	id1, id2, id3 := 1, 2, 3
	optA, optB, optC := "A", "B", "C"
	isTrue, isFalse := true, false
	logs := []*dbModels.QuestionAnswerLog{
		{Id: &id1, QuestionId: &testID, SelectedOption: &optA, IsCorrect: &isTrue, CreatedAt: &logTime},
		{Id: &id2, QuestionId: &testID, SelectedOption: &optB, IsCorrect: &isTrue, CreatedAt: &logTime},
		{Id: &id3, QuestionId: &testID, SelectedOption: &optC, IsCorrect: &isFalse, CreatedAt: &logTime},
	}

	suite.mockQuestionAnswerLogPeer.EXPECT().
		Select(mock.Anything, mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(logs, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/trend?days=3", nil)
	suite.controller.GetQuestionsTrend(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := []models.QuestionTrendPoint{
		{Date: dateKeys[0], PracticeCount: 3, AccuracyRate: 66.7},
		{Date: dateKeys[1], PracticeCount: 0, AccuracyRate: 0},
		{Date: dateKeys[2], PracticeCount: 0, AccuracyRate: 0},
	}
	expectedJSON, marshalErr := json.Marshal(expected)
	assert.NoError(suite.T(), marshalErr)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}

// TestGetQuestionsTrendBucketsByReportTimeZone tests that GetQuestionsTrend
// buckets an answer log by its calendar day in common.ReportTimeZone rather
// than the UTC calendar day the timestamp is stored/parsed in. The log is
// placed at 00:30 in ReportTimeZone converted to its equivalent UTC instant,
// which for a timezone ahead of UTC falls on the previous UTC calendar day --
// exactly the mismatch that caused trend charts to bucket a practice into the
// wrong day.
func (suite *ControllerTestSuite) TestGetQuestionsTrendBucketsByReportTimeZone() {
	testID := 1
	now := common.NowInReportTimeZone()
	dateKeys := common.DailyDateKeys(3, now)

	reportMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 30, 0, 0, now.Location())
	logTime := reportMidnight.UTC()

	id1 := 1
	optA := "A"
	isTrue := true
	logs := []*dbModels.QuestionAnswerLog{
		{Id: &id1, QuestionId: &testID, SelectedOption: &optA, IsCorrect: &isTrue, CreatedAt: &logTime},
	}

	suite.mockQuestionAnswerLogPeer.EXPECT().
		Select(mock.Anything, mock.Anything, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(logs, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/trend?days=3", nil)
	suite.controller.GetQuestionsTrend(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expected := []models.QuestionTrendPoint{
		{Date: dateKeys[0], PracticeCount: 0, AccuracyRate: 0},
		{Date: dateKeys[1], PracticeCount: 0, AccuracyRate: 0},
		{Date: dateKeys[2], PracticeCount: 1, AccuracyRate: 100},
	}
	expectedJSON, marshalErr2 := json.Marshal(expected)
	assert.NoError(suite.T(), marshalErr2)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
