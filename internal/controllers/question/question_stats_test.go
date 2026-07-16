package question

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestStatsQuestions tests the StatsQuestions handler
func (suite *ControllerTestSuite) TestStatsQuestions() {
	// Select receives only the two count columns; match by value, not pointer address.
	suite.mockQuestionPeer.EXPECT().
		Select(
			mock.MatchedBy(func(cols []*string) bool {
				return len(cols) == 2 &&
					*cols[0] == schema.QUESTION_COUNT_PRACTISE &&
					*cols[1] == schema.QUESTION_COUNT_FAILURE_PRACTISE
			}),
			(squirrel.Sqlizer)(nil),
			([]*string)(nil),
			(*uint64)(nil),
			(*uint64)(nil),
		).
		Return(getSampleQuestions(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/stats", nil)
	suite.controller.StatsQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	// Q1 (10-2)*100/10=80 → "71-80%" (count_practise=10), Q2 (8-0)*100/8=100 → "100%" (count_practise=8)
	// Q3 (2-1)*100/2=50  → "41-50%" (count_practise=2), Q4 (15-4)*100/15=73 → "71-80%" (count_practise=15)
	// Q5 (3-0)*100/3=100 → "100%" (count_practise=3)
	emptyBreakdown := []models.PracticeCountBucket{{Range: "0", Count: 0}}
	expected := models.QuestionStats{
		AccuracyDistribution: []models.AccuracyBucket{
			{Range: "100%", Count: 2, PracticeCountBreakdown: []models.PracticeCountBucket{
				{Range: "0", Count: 0},
				{Range: "1", Count: 0},
				{Range: "2 ~ 4", Count: 1},
				{Range: "5+", Count: 1},
			}},
			{Range: "91-99%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "81-90%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "71-80%", Count: 2, PracticeCountBreakdown: []models.PracticeCountBucket{
				{Range: "0", Count: 0},
				{Range: "1", Count: 0},
				{Range: "2 ~ 4", Count: 0},
				{Range: "5 ~ 9", Count: 0},
				{Range: "10+", Count: 2},
			}},
			{Range: "61-70%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "51-60%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "41-50%", Count: 1, PracticeCountBreakdown: []models.PracticeCountBucket{
				{Range: "0", Count: 0},
				{Range: "1", Count: 0},
				{Range: "2+", Count: 1},
			}},
			{Range: "31-40%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "21-30%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "11-20%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "1-10%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "0%", Count: 0, PracticeCountBreakdown: emptyBreakdown},
			{Range: "N/A", Count: 0, PracticeCountBreakdown: emptyBreakdown},
		},
	}
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
