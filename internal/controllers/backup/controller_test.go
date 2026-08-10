package backup

import (
	"testing"
	"time"

	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"

	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite is a test suite for the backup Controller
type ControllerTestSuite struct {
	suite.Suite
	controller                *Controller
	mockWordPeer              *mocks.MockWordPeer
	mockWordDefinitionPeer    *mocks.MockWordDefinitionsPeer
	mockQuestionPeer          *mocks.MockQuestionPeer
	mockQuestionAnswerLogPeer *mocks.MockQuestionAnswerLogPeer
	mockWordPracticeLogPeer   *mocks.MockWordPracticeLogPeer
	mockNotePeer              *mocks.MockNotePeer
	mockBackupPeer            *mocks.MockBackupPeer
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *ControllerTestSuite) SetupTest() {
	suite.mockWordPeer = mocks.NewMockWordPeer(suite.T())
	suite.mockWordDefinitionPeer = mocks.NewMockWordDefinitionsPeer(suite.T())
	suite.mockQuestionPeer = mocks.NewMockQuestionPeer(suite.T())
	suite.mockQuestionAnswerLogPeer = mocks.NewMockQuestionAnswerLogPeer(suite.T())
	suite.mockWordPracticeLogPeer = mocks.NewMockWordPracticeLogPeer(suite.T())
	suite.mockNotePeer = mocks.NewMockNotePeer(suite.T())
	suite.mockBackupPeer = mocks.NewMockBackupPeer(suite.T())

	suite.controller = New(
		suite.mockWordPeer,
		suite.mockWordDefinitionPeer,
		suite.mockQuestionPeer,
		suite.mockQuestionAnswerLogPeer,
		suite.mockWordPracticeLogPeer,
		suite.mockNotePeer,
		suite.mockBackupPeer,
	)
}

var testModifyTime = time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

// sampleWord returns a minimally valid Word db model for testing
func sampleWord(id int) *dbModels.Word {
	word := "apple"
	familiarity := "red"
	count := 0
	return &dbModels.Word{
		Id: &id, Word: &word, Familiarity: &familiarity, CountPractise: &count,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}

// sampleWordDefinition returns a minimally valid WordDefinition db model for testing
func sampleWordDefinition(id, wordID int) *dbModels.WordDefinition {
	pos := "noun"
	def := "a fruit"
	return &dbModels.WordDefinition{
		Id: &id, WordId: &wordID, PartOfSpeech: &pos, Definition: &def,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}

// sampleQuestion returns a minimally valid Question db model for testing
func sampleQuestion(id int) *dbModels.Question {
	question := "What is 1+1?"
	optionA := "2"
	answer := "A"
	count := 0
	failCount := 0
	return &dbModels.Question{
		Id: &id, Question: &question, OptionA: &optionA, Answer: &answer,
		CountPractise: &count, CountFailurePractise: &failCount,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}

// sampleQuestionAnswerLog returns a minimally valid QuestionAnswerLog db model for testing
func sampleQuestionAnswerLog(id, questionID int) *dbModels.QuestionAnswerLog {
	selected := "A"
	correct := true
	return &dbModels.QuestionAnswerLog{
		Id: &id, QuestionId: &questionID, SelectedOption: &selected, IsCorrect: &correct,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}

// sampleWordPracticeLog returns a minimally valid WordPracticeLog db model for testing
func sampleWordPracticeLog(id, wordID int) *dbModels.WordPracticeLog {
	familiarity := "yellow"
	previous := "red"
	return &dbModels.WordPracticeLog{
		Id: &id, WordId: &wordID, Familiarity: &familiarity, PreviousFamiliarity: &previous,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}

// sampleNote returns a minimally valid Note db model for testing
func sampleNote(id int) *dbModels.Note {
	title := "Grammar Rules"
	sortOrder := 1
	return &dbModels.Note{
		Id: &id, Title: &title, SortOrder: &sortOrder,
		CreatedAt: &testModifyTime, UpdatedAt: &testModifyTime,
	}
}
