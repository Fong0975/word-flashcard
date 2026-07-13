package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
	"word-flashcard/utils"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

type QuestionControllerTestSuite struct {
	suite.Suite
	controller                *QuestionController
	mockQuestionPeer          *mocks.MockQuestionPeer
	mockQuestionAnswerLogPeer *mocks.MockQuestionAnswerLogPeer
}

// TestQuestionControllerTestSuite runs the QuestionControllerTestSuite
func TestQuestionControllerTestSuite(t *testing.T) {
	suite.Run(t, new(QuestionControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *QuestionControllerTestSuite) SetupTest() {
	suite.mockQuestionPeer = mocks.NewMockQuestionPeer(suite.T())
	suite.mockQuestionAnswerLogPeer = mocks.NewMockQuestionAnswerLogPeer(suite.T())
	suite.controller = NewQuestionController(suite.mockQuestionPeer, suite.mockQuestionAnswerLogPeer)
}

// TestListQuestions tests the ListQuestions handler
func (suite *QuestionControllerTestSuite) TestListQuestions() {
	// Mock mockQuestionPeer methods as needed
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleQuestions(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions", nil)
	suite.controller.ListQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestion, err := json.Marshal(getExpectedQuestions())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestion), w.Body.String())
}

// TestGetQuestions tests the GetQuestions handler
func (suite *QuestionControllerTestSuite) TestGetQuestions() {
	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{getSampleQuestions()[1]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/2", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "2"}}
	suite.controller.GetQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestion, err := json.Marshal(getExpectedQuestions()[1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestion), w.Body.String())
}

// TestRandomQuestions tests the RandomQuestions handler
func (suite *QuestionControllerTestSuite) TestRandomQuestions() {
	// count=2 bucket quota breakdown (5:3:2 ratio, integer division):
	//   quota1 = 2*5/10 = 1 (unpractised)
	//   quota2 = 2*3/10 = 0 (high-failure-rate) → skipped by fetchQuestionBucket
	//   quota3 = 2-1-0  = 1 (high-success-rate)
	randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
		return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
	})
	limit1 := uint64(1)
	limit3 := uint64(1)

	// Bucket 1: unpractised (count_practise = 0)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, randomOrderMatcher, &limit1, (*uint64)(nil)).
		Return([]*dbModels.Question{getSampleQuestions()[1]}, nil).Times(1)

	// Bucket 2: quota=0, fetchQuestionBucket returns early — no Select call expected

	// Bucket 3: high success rate (catch-all where, limit=1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit3, (*uint64)(nil)).
		Return([]*dbModels.Question{getSampleQuestions()[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"count\": 2}}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/random", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.RandomQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body contains the expected questions (order may vary due to shuffle)
	var actualQuestions []*models.Question
	err := json.Unmarshal(w.Body.Bytes(), &actualQuestions)
	assert.NoError(suite.T(), err)
	assert.ElementsMatch(suite.T(), []*models.Question{getExpectedQuestions()[1], getExpectedQuestions()[3]}, actualQuestions)
}

// TestCreateQuestions tests the CreateQuestions handler
func (suite *QuestionControllerTestSuite) TestCreateQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: int64(testID)}

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Insert(mock.MatchedBy(func(question *dbModels.Question) bool {
			return question != nil && question.Question != nil && question.OptionA != nil && question.Answer != nil
		})).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{getSampleQuestions()[0]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"question\": \"The marketing department has decided to ______ the new product launch until next month.\",\"option_a\": \"postpone\",\"option_b\": \"postpone\",\"option_c\": \"postponing\",\"option_d\": \"postponement\",\"answer\": \"A\",\"reference\": \"Google Gemini Sample Q01\",\"notes\": \"- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。\",\"countPractise\": 10,\"countFailurePractise\": 2}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := getExpectedQuestions()[0]
	expectedQuestionJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestionJSON), w.Body.String())
}

// TestUpdateQuestions tests the UpdateQuestions handler. A plain edit (no
// "practiced" field) must leave last_answered_at untouched, since it's not a
// completed practice attempt.
func (suite *QuestionControllerTestSuite) TestUpdateQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]
	dbQuestion.Answer = utils.StrPtr("D")

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Update(mock.MatchedBy(func(question *dbModels.Question) bool {
			return question.Answer != nil && *question.Answer == "D" && question.LastAnsweredAt == nil
		}), where).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{dbQuestion}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"answer\": \"D\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/questions/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestion := getExpectedQuestions()[0]
	expectedQuestion.Answer = utils.StrPtr("D")
	expected, err := json.Marshal(expectedQuestion)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expected), w.Body.String())
}

// TestUpdateQuestionsWithPracticedSetsLastAnsweredAt tests that sending
// "practiced": true (as the quiz-completion sync does) stamps last_answered_at.
func (suite *QuestionControllerTestSuite) TestUpdateQuestionsWithPracticedSetsLastAnsweredAt() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]

	suite.mockQuestionPeer.EXPECT().
		Update(mock.MatchedBy(func(question *dbModels.Question) bool {
			return question.LastAnsweredAt != nil && time.Since(*question.LastAnsweredAt) < time.Minute
		}), where).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{dbQuestion}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"answer\": \"A\", \"count_practise\": 1, \"count_failure_practise\": 0, \"practiced\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/questions/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateQuestions(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateQuestionsWithSelectedOptionLogsCorrectAnswer tests that sending
// "selected_option" matching the true answer logs an is_correct=true record,
// keyed by the question's own option lettering (not any shuffled display order).
func (suite *QuestionControllerTestSuite) TestUpdateQuestionsWithSelectedOptionLogsCorrectAnswer() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]

	suite.mockQuestionPeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{dbQuestion}, nil).Times(1)
	suite.mockQuestionAnswerLogPeer.EXPECT().
		Insert(mock.MatchedBy(func(log *dbModels.QuestionAnswerLog) bool {
			isQuestionID := log.QuestionId != nil && *log.QuestionId == testID
			isSelectedOption := log.SelectedOption != nil && *log.SelectedOption == "A"
			isCorrect := log.IsCorrect != nil && *log.IsCorrect
			return isQuestionID && isSelectedOption && isCorrect
		})).
		Return(int64(1), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"answer\": \"A\", \"selected_option\": \"a\", \"practiced\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/questions/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateQuestions(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateQuestionsWithSelectedOptionLogsIncorrectAnswer tests that a
// selected_option different from the true answer logs an is_correct=false record.
func (suite *QuestionControllerTestSuite) TestUpdateQuestionsWithSelectedOptionLogsIncorrectAnswer() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]

	suite.mockQuestionPeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{dbQuestion}, nil).Times(1)
	suite.mockQuestionAnswerLogPeer.EXPECT().
		Insert(mock.MatchedBy(func(log *dbModels.QuestionAnswerLog) bool {
			isSelectedOption := log.SelectedOption != nil && *log.SelectedOption == "B"
			isCorrect := log.IsCorrect != nil && !*log.IsCorrect
			return isSelectedOption && isCorrect
		})).
		Return(int64(1), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"answer\": \"A\", \"selected_option\": \"B\", \"practiced\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/questions/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateQuestions(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateQuestionsLogInsertFailureStillReturnsSuccess tests that an
// answer log insert failure is best-effort: the question update already
// committed, so the handler must still respond with 200 rather than
// surfacing a 500 for a write that already succeeded.
func (suite *QuestionControllerTestSuite) TestUpdateQuestionsLogInsertFailureStillReturnsSuccess() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]

	suite.mockQuestionPeer.EXPECT().
		Update(mock.Anything, where).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{dbQuestion}, nil).Times(1)
	suite.mockQuestionAnswerLogPeer.EXPECT().
		Insert(mock.Anything).
		Return(int64(0), fmt.Errorf("insert failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"answer\": \"A\", \"selected_option\": \"A\", \"practiced\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/questions/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateQuestions(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestDeleteQuestions tests the DeleteQuestions handler
func (suite *QuestionControllerTestSuite) TestDeleteQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Delete(where).
		Return(int64(testID), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/questions/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	// Verify the response body
	assert.Equal(suite.T(), "", w.Body.String())
}

// TestCountQuestions tests the CountQuestions handler
func (suite *QuestionControllerTestSuite) TestCountQuestions() {
	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Count().
		Return(int64(5), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/count", nil)
	suite.controller.CountQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := `{"count":5}`
	assert.Equal(suite.T(), expected, w.Body.String())
}

// TestStatsQuestions tests the StatsQuestions handler
func (suite *QuestionControllerTestSuite) TestStatsQuestions() {
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

// TestGetQuestionLogs tests the GetQuestionLogs handler
func (suite *QuestionControllerTestSuite) TestGetQuestionLogs() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ANSWER_LOG_QUESTION_ID: testID}
	limitPtr := uint64(15)

	suite.mockQuestionAnswerLogPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, &limitPtr, (*uint64)(nil)).
		Return(getSampleQuestionAnswerLogs(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/questions/1/logs", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.GetQuestionLogs(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected, err := json.Marshal(getExpectedQuestionAnswerLogEntries())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expected), w.Body.String())
}

// TestGetQuestionsTrend tests the GetQuestionsTrend handler. It uses a small
// 3-day window so the expected zero-filled output is easy to hand-compute:
// 3 logs on the oldest day of the window (2 correct, 1 incorrect) →
// accuracy_rate = round1(2*100/3) = 66.7, the other two days stay zero-filled.
func (suite *QuestionControllerTestSuite) TestGetQuestionsTrend() {
	testID := 1
	now := time.Now()
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

// getSampleQuestionAnswerLogs returns sample QuestionAnswerLog rows for testing
func getSampleQuestionAnswerLogs() []*dbModels.QuestionAnswerLog {
	logTime := time.Date(2024, 1, 1, 10, 30, 0, 0, time.UTC)

	id1, id2 := 1, 2
	questionID := 1
	optA, optB := "A", "B"
	isTrue, isFalse := true, false

	return []*dbModels.QuestionAnswerLog{
		{Id: &id1, QuestionId: &questionID, SelectedOption: &optA, IsCorrect: &isTrue, CreatedAt: &logTime},
		{Id: &id2, QuestionId: &questionID, SelectedOption: &optB, IsCorrect: &isFalse, CreatedAt: &logTime},
	}
}

// getExpectedQuestionAnswerLogEntries returns the expected API response for getSampleQuestionAnswerLogs
func getExpectedQuestionAnswerLogEntries() []models.QuestionAnswerLogEntry {
	logTime := time.Date(2024, 1, 1, 10, 30, 0, 0, time.UTC)

	return []models.QuestionAnswerLogEntry{
		{ID: 1, SelectedOption: "A", IsCorrect: true, CreatedAt: logTime},
		{ID: 2, SelectedOption: "B", IsCorrect: false, CreatedAt: logTime},
	}
}

// getSampleQuestions return sample Question for testing
func getSampleQuestions() []*dbModels.Question {
	modifyTime := time.Now()

	testData := []struct {
		question             string
		optionA              string
		optionB              string
		optionC              string
		optionD              string
		answer               string
		reference            string
		notes                string
		countPractise        int
		countFailurePractise int
	}{
		{
			question:             "The marketing department has decided to ______ the new product launch until next month.",
			optionA:              "postpone",
			optionB:              "postpone",
			optionC:              "postponing",
			optionD:              "postponement",
			answer:               "A",
			reference:            "Google Gemini Sample Q01",
			notes:                "- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。",
			countPractise:        10,
			countFailurePractise: 2,
		},
		{
			question:             "Ms. Chen requested that the report ______ on her desk before 5:00 PM today.",
			optionA:              "is placed",
			optionB:              "be placed",
			optionC:              "places",
			optionD:              "placing",
			answer:               "B",
			reference:            "Google Gemini Sample Q02",
			notes:                "- 要求動詞 (request/suggest) 之後的子句，動詞需用「should + 原形動詞」，should可省略，故用 `be placed`。",
			countPractise:        8,
			countFailurePractise: 0,
		},
		{
			question:             "Employees are reminded to turn off their computers ______ leaving the office.",
			optionA:              "after",
			optionB:              "while",
			optionC:              "before",
			optionD:              "during",
			answer:               "C",
			reference:            "Google Gemini Sample Q03",
			notes:                "- 根據句意「員工被提醒在離開辦公室『前』關閉電腦」，應填入表示時間先後的 `before`。",
			countPractise:        2,
			countFailurePractise: 1,
		},
		{
			question:             "The company offers a comprehensive training program to all ______ staff members.",
			optionA:              "new",
			optionB:              "newly",
			optionC:              "newest",
			optionD:              "newness",
			answer:               "A",
			reference:            "Google Gemini Sample Q04",
			notes:                "- 空缺處修飾名詞 `staff members`，需用形容詞，new 表示「新的」。",
			countPractise:        15,
			countFailurePractise: 4,
		},
		{
			question:             "Due to the ______ weather conditions, the outdoor conference has been cancelled.",
			optionA:              "adverse",
			optionB:              "adversely",
			optionC:              "adversary",
			optionD:              "adverseness",
			answer:               "A",
			reference:            "Google Gemini Sample Q05",
			notes:                "- 形容詞修飾名詞 `conditions，adverse` 為形容詞，意為「*不利的、惡劣的*」。",
			countPractise:        3,
			countFailurePractise: 0,
		},
	}

	questions := make([]*dbModels.Question, 0, len(testData))
	for index, data := range testData {
		newID := index + 1

		questions = append(questions, &dbModels.Question{
			Id:                   &newID,
			Question:             &data.question,
			OptionA:              &data.optionA,
			OptionB:              &data.optionB,
			OptionC:              &data.optionC,
			OptionD:              &data.optionD,
			Answer:               &data.answer,
			Reference:            &data.reference,
			Notes:                &data.notes,
			CountPractise:        &data.countPractise,
			CountFailurePractise: &data.countFailurePractise,
			CreatedAt:            &modifyTime,
			UpdatedAt:            &modifyTime,
		})
	}

	return questions
}

// getExpectedQuestions returns expected question for testing
func getExpectedQuestions() []*models.Question {
	return []*models.Question{
		{
			ID:                   utils.IntPtr(1),
			Question:             utils.StrPtr("The marketing department has decided to ______ the new product launch until next month."),
			OptionA:              utils.StrPtr("postpone"),
			OptionB:              utils.StrPtr("postpone"),
			OptionC:              utils.StrPtr("postponing"),
			OptionD:              utils.StrPtr("postponement"),
			Answer:               utils.StrPtr("A"),
			Reference:            utils.StrPtr("Google Gemini Sample Q01"),
			Notes:                utils.StrPtr("- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。"),
			CountPractise:        utils.IntPtr(10),
			CountFailurePractise: utils.IntPtr(2),
		},
		{
			ID:                   utils.IntPtr(2),
			Question:             utils.StrPtr("Ms. Chen requested that the report ______ on her desk before 5:00 PM today."),
			OptionA:              utils.StrPtr("is placed"),
			OptionB:              utils.StrPtr("be placed"),
			OptionC:              utils.StrPtr("places"),
			OptionD:              utils.StrPtr("placing"),
			Answer:               utils.StrPtr("B"),
			Reference:            utils.StrPtr("Google Gemini Sample Q02"),
			Notes:                utils.StrPtr("- 要求動詞 (request/suggest) 之後的子句，動詞需用「should + 原形動詞」，should可省略，故用 `be placed`。"),
			CountPractise:        utils.IntPtr(8),
			CountFailurePractise: utils.IntPtr(0),
		},
		{
			ID:                   utils.IntPtr(3),
			Question:             utils.StrPtr("Employees are reminded to turn off their computers ______ leaving the office."),
			OptionA:              utils.StrPtr("after"),
			OptionB:              utils.StrPtr("while"),
			OptionC:              utils.StrPtr("before"),
			OptionD:              utils.StrPtr("during"),
			Answer:               utils.StrPtr("C"),
			Reference:            utils.StrPtr("Google Gemini Sample Q03"),
			Notes:                utils.StrPtr("- 根據句意「員工被提醒在離開辦公室『前』關閉電腦」，應填入表示時間先後的 `before`。"),
			CountPractise:        utils.IntPtr(2),
			CountFailurePractise: utils.IntPtr(1),
		},
		{
			ID:                   utils.IntPtr(4),
			Question:             utils.StrPtr("The company offers a comprehensive training program to all ______ staff members."),
			OptionA:              utils.StrPtr("new"),
			OptionB:              utils.StrPtr("newly"),
			OptionC:              utils.StrPtr("newest"),
			OptionD:              utils.StrPtr("newness"),
			Answer:               utils.StrPtr("A"),
			Reference:            utils.StrPtr("Google Gemini Sample Q04"),
			Notes:                utils.StrPtr("- 空缺處修飾名詞 `staff members`，需用形容詞，new 表示「新的」。"),
			CountPractise:        utils.IntPtr(15),
			CountFailurePractise: utils.IntPtr(4),
		},
		{
			ID:                   utils.IntPtr(5),
			Question:             utils.StrPtr("Due to the ______ weather conditions, the outdoor conference has been cancelled."),
			OptionA:              utils.StrPtr("adverse"),
			OptionB:              utils.StrPtr("adversely"),
			OptionC:              utils.StrPtr("adversary"),
			OptionD:              utils.StrPtr("adverseness"),
			Answer:               utils.StrPtr("A"),
			Reference:            utils.StrPtr("Google Gemini Sample Q05"),
			Notes:                utils.StrPtr("- 形容詞修飾名詞 `conditions，adverse` 為形容詞，意為「*不利的、惡劣的*」。"),
			CountPractise:        utils.IntPtr(3),
			CountFailurePractise: utils.IntPtr(0),
		},
	}
}
