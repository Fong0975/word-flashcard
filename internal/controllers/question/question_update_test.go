package question

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"time"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/utils"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestUpdateQuestions tests the UpdateQuestions handler. A plain edit (no
// "practiced" field) must leave last_answered_at untouched, since it's not a
// completed practice attempt.
func (suite *ControllerTestSuite) TestUpdateQuestions() {
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
func (suite *ControllerTestSuite) TestUpdateQuestionsWithPracticedSetsLastAnsweredAt() {
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
func (suite *ControllerTestSuite) TestUpdateQuestionsWithSelectedOptionLogsCorrectAnswer() {
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
func (suite *ControllerTestSuite) TestUpdateQuestionsWithSelectedOptionLogsIncorrectAnswer() {
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
func (suite *ControllerTestSuite) TestUpdateQuestionsLogInsertFailureStillReturnsSuccess() {
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
