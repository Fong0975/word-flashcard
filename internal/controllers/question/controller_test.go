package question

import (
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
	"word-flashcard/utils"

	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite is a test suite for the question Controller
type ControllerTestSuite struct {
	suite.Suite
	controller                *Controller
	mockQuestionPeer          *mocks.MockQuestionPeer
	mockQuestionAnswerLogPeer *mocks.MockQuestionAnswerLogPeer
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *ControllerTestSuite) SetupTest() {
	suite.mockQuestionPeer = mocks.NewMockQuestionPeer(suite.T())
	suite.mockQuestionAnswerLogPeer = mocks.NewMockQuestionAnswerLogPeer(suite.T())
	suite.controller = New(suite.mockQuestionPeer, suite.mockQuestionAnswerLogPeer)
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
