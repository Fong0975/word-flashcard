package controllers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
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
	controller       *QuestionController
	mockQuestionPeer *mocks.MockQuestionPeer
}

// TestQuestionControllerTestSuite runs the QuestionControllerTestSuite
func TestQuestionControllerTestSuite(t *testing.T) {
	suite.Run(t, new(QuestionControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *QuestionControllerTestSuite) SetupTest() {
	suite.mockQuestionPeer = mocks.NewMockQuestionPeer(suite.T())
	suite.controller = NewQuestionController(suite.mockQuestionPeer)
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
	// Mock mockQuestionPeer methods as needed
	limitPtr := uint64(2)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.MatchedBy(func(orderBy []*string) bool {
			b := len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
			return b
		}), &limitPtr, (*uint64)(nil)).
		Return([]*dbModels.Question{getSampleQuestions()[1], getSampleQuestions()[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"count\": 2}}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/random", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.RandomQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedQuestions, err := json.Marshal([]*models.Question{getExpectedQuestions()[1], getExpectedQuestions()[3]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestions), w.Body.String())

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

// TestUpdateQuestions tests the UpdateQuestions handler
func (suite *QuestionControllerTestSuite) TestUpdateQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: testID}
	dbQuestion := getSampleQuestions()[0]
	dbQuestion.Answer = utils.StrPtr("D")

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Update(mock.MatchedBy(func(question *dbModels.Question) bool {
			return question.Answer != nil && *question.Answer == "D"
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
