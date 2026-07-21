package word

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

// TestUpdateWord tests the UpdateWord handler
func (suite *ControllerTestSuite) TestUpdateWord() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}

	existingCount := 5
	updatedCount := existingCount + 1

	// Word with pre-existing count_practise returned by first Select.
	wordBeforeUpdate := getSampleWords()[0]
	wordBeforeUpdate.CountPractise = &existingCount

	// Word returned by second Select after update.
	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")
	dbWord.CountPractise = &updatedCount

	// First Select: fetch current count_practise before update.
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{wordBeforeUpdate}, nil).Once()

	// Update: verify familiarity, count_practise, and last_practiced_at are updated.
	suite.mockWordPeer.EXPECT().
		Update(mock.MatchedBy(func(word *dbModels.Word) bool {
			isFamiliarity := word.Familiarity != nil && *word.Familiarity == "yellow"
			isCountPractise := word.CountPractise != nil && *word.CountPractise == updatedCount
			isLastPracticedAt := word.LastPracticedAt != nil && time.Since(*word.LastPracticedAt) < time.Minute
			return word != nil && word.Id == nil && isFamiliarity && isCountPractise && isLastPracticedAt
		}), whereWord).
		Return(int64(1), nil).Once()

	// Second Select: fetch updated word for the response.
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	// Practice log: verify it records the familiarity transition (green -> yellow).
	suite.mockWordPracticeLogPeer.EXPECT().
		Insert(mock.MatchedBy(func(log *dbModels.WordPracticeLog) bool {
			isWordID := log.WordId != nil && *log.WordId == testWordID
			isFamiliarity := log.Familiarity != nil && *log.Familiarity == "yellow"
			isPreviousFamiliarity := log.PreviousFamiliarity != nil && *log.PreviousFamiliarity == "green"
			return isWordID && isFamiliarity && isPreviousFamiliarity
		})).
		Return(int64(1), nil).Once()

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"familiarity\": \"yellow\", \"increment_count_practise\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWordObj := getExpectedWords()[0]
	expectedWordObj.Familiarity = utils.StrPtr("yellow")
	expectedWordObj.CountPractise = &updatedCount
	expectedWord, err := json.Marshal(expectedWordObj)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestUpdateWordLogInsertFailureStillReturnsSuccess tests that a practice
// log insert failure is best-effort: the word update already committed, so
// the handler must still respond with 200 rather than surfacing a 500 for
// a write that already succeeded.
func (suite *ControllerTestSuite) TestUpdateWordLogInsertFailureStillReturnsSuccess() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}

	existingCount := 5
	updatedCount := existingCount + 1

	wordBeforeUpdate := getSampleWords()[0]
	wordBeforeUpdate.CountPractise = &existingCount

	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")
	dbWord.CountPractise = &updatedCount

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{wordBeforeUpdate}, nil).Once()

	suite.mockWordPeer.EXPECT().
		Update(mock.Anything, whereWord).
		Return(int64(1), nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	suite.mockWordPracticeLogPeer.EXPECT().
		Insert(mock.Anything).
		Return(int64(0), fmt.Errorf("insert failed")).Once()

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"familiarity\": \"yellow\", \"increment_count_practise\": true}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateWordWithQuizSessionFirstSubmissionInsertsLog tests that the first
// familiarity submission for a word within a given quiz session behaves like
// a normal practice: count_practise increments and a new log row is inserted
// carrying the quiz_session_id.
func (suite *ControllerTestSuite) TestUpdateWordWithQuizSessionFirstSubmissionInsertsLog() {
	testWordID := 1
	quizSessionID := "session-1"
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}
	whereLogSession := squirrel.Eq{
		schema.WORD_PRACTICE_LOG_WORD_ID:         testWordID,
		schema.WORD_PRACTICE_LOG_QUIZ_SESSION_ID: quizSessionID,
	}

	existingCount := 5
	updatedCount := existingCount + 1

	wordBeforeUpdate := getSampleWords()[0]
	wordBeforeUpdate.CountPractise = &existingCount

	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")
	dbWord.CountPractise = &updatedCount

	// No existing log for this quiz session yet.
	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, whereLogSession, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordPracticeLog{}, nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{wordBeforeUpdate}, nil).Once()

	suite.mockWordPeer.EXPECT().
		Update(mock.MatchedBy(func(word *dbModels.Word) bool {
			isCountPractise := word.CountPractise != nil && *word.CountPractise == updatedCount
			isLastPracticedAt := word.LastPracticedAt != nil
			return isCountPractise && isLastPracticedAt
		}), whereWord).
		Return(int64(1), nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	suite.mockWordPracticeLogPeer.EXPECT().
		Insert(mock.MatchedBy(func(log *dbModels.WordPracticeLog) bool {
			isWordID := log.WordId != nil && *log.WordId == testWordID
			isFamiliarity := log.Familiarity != nil && *log.Familiarity == "yellow"
			isPreviousFamiliarity := log.PreviousFamiliarity != nil && *log.PreviousFamiliarity == "green"
			isSession := log.QuizSessionID != nil && *log.QuizSessionID == quizSessionID
			return isWordID && isFamiliarity && isPreviousFamiliarity && isSession
		})).
		Return(int64(1), nil).Once()

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := fmt.Sprintf(`{"familiarity": "yellow", "increment_count_practise": true, "quiz_session_id": "%s"}`, quizSessionID)
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateWordWithQuizSessionResubmissionUpdatesExistingLog tests that
// resubmitting a familiarity for the same word within the same quiz session
// (the user navigated back and re-answered) corrects the existing log row in
// place instead of inserting a duplicate, and does not increment
// count_practise/last_practiced_at again.
func (suite *ControllerTestSuite) TestUpdateWordWithQuizSessionResubmissionUpdatesExistingLog() {
	testWordID := 1
	quizSessionID := "session-1"
	existingLogID := 42
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}
	whereLogSession := squirrel.Eq{
		schema.WORD_PRACTICE_LOG_WORD_ID:         testWordID,
		schema.WORD_PRACTICE_LOG_QUIZ_SESSION_ID: quizSessionID,
	}
	whereLogID := squirrel.Eq{schema.WORD_PRACTICE_LOG_ID: existingLogID}

	existingLog := &dbModels.WordPracticeLog{
		Id:                  &existingLogID,
		WordId:              &testWordID,
		Familiarity:         utils.StrPtr("red"),
		PreviousFamiliarity: utils.StrPtr("green"),
		QuizSessionID:       &quizSessionID,
	}

	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")

	// An existing log already exists for this (word, quiz session) pair.
	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, whereLogSession, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordPracticeLog{existingLog}, nil).Once()

	// count_practise/last_practiced_at must NOT be touched on resubmission.
	suite.mockWordPeer.EXPECT().
		Update(mock.MatchedBy(func(word *dbModels.Word) bool {
			isFamiliarity := word.Familiarity != nil && *word.Familiarity == "yellow"
			return isFamiliarity && word.CountPractise == nil && word.LastPracticedAt == nil
		}), whereWord).
		Return(int64(1), nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	// The existing log row is corrected in place; previous_familiarity is untouched.
	suite.mockWordPracticeLogPeer.EXPECT().
		Update(mock.MatchedBy(func(log *dbModels.WordPracticeLog) bool {
			isFamiliarity := log.Familiarity != nil && *log.Familiarity == "yellow"
			return isFamiliarity && log.PreviousFamiliarity == nil && log.WordId == nil && log.QuizSessionID == nil
		}), whereLogID).
		Return(int64(1), nil).Once()

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := fmt.Sprintf(`{"familiarity": "yellow", "increment_count_practise": true, "quiz_session_id": "%s"}`, quizSessionID)
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// wordPracticeLogPeer.Insert must never be called on resubmission (implicitly
	// verified by AssertExpectations in SetupTest's t.Cleanup, since no Insert
	// expectation was registered above).
}

// TestUpdateWordLogUpdateFailureStillReturnsSuccess tests that a practice log
// correction failure on resubmission is best-effort, mirroring
// TestUpdateWordLogInsertFailureStillReturnsSuccess for the insert path.
func (suite *ControllerTestSuite) TestUpdateWordLogUpdateFailureStillReturnsSuccess() {
	testWordID := 1
	quizSessionID := "session-1"
	existingLogID := 42
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}
	whereLogSession := squirrel.Eq{
		schema.WORD_PRACTICE_LOG_WORD_ID:         testWordID,
		schema.WORD_PRACTICE_LOG_QUIZ_SESSION_ID: quizSessionID,
	}

	existingLog := &dbModels.WordPracticeLog{
		Id:                  &existingLogID,
		WordId:              &testWordID,
		Familiarity:         utils.StrPtr("red"),
		PreviousFamiliarity: utils.StrPtr("green"),
		QuizSessionID:       &quizSessionID,
	}

	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")

	suite.mockWordPracticeLogPeer.EXPECT().
		Select(mock.Anything, whereLogSession, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordPracticeLog{existingLog}, nil).Once()

	suite.mockWordPeer.EXPECT().
		Update(mock.Anything, whereWord).
		Return(int64(1), nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	suite.mockWordPracticeLogPeer.EXPECT().
		Update(mock.Anything, mock.Anything).
		Return(int64(0), fmt.Errorf("update failed")).Once()

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := fmt.Sprintf(`{"familiarity": "yellow", "increment_count_practise": true, "quiz_session_id": "%s"}`, quizSessionID)
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateWordWithoutIncrementDoesNotSetLastPracticedAt tests that a plain
// edit (no increment_count_practise) leaves last_practiced_at untouched,
// distinguishing it from updated_at which every edit bumps.
func (suite *ControllerTestSuite) TestUpdateWordWithoutIncrementDoesNotSetLastPracticedAt() {
	testWordID := 1
	whereWord := squirrel.Eq{schema.WORD_ID: testWordID}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{testWordID}}

	dbWord := getSampleWords()[0]
	dbWord.Familiarity = utils.StrPtr("yellow")

	// Update: verify last_practiced_at is left nil since increment_count_practise was not set.
	suite.mockWordPeer.EXPECT().
		Update(mock.MatchedBy(func(word *dbModels.Word) bool {
			isFamiliarity := word.Familiarity != nil && *word.Familiarity == "yellow"
			return word != nil && word.Id == nil && isFamiliarity && word.LastPracticedAt == nil
		}), whereWord).
		Return(int64(1), nil).Once()

	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{dbWord}, nil).Once()

	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Once()

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"familiarity\": \"yellow\"}"
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/words/1", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.UpdateWord(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
}
