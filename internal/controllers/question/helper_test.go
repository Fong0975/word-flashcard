package question

import (
	"testing"
	"word-flashcard/data/mocks"

	"github.com/stretchr/testify/suite"
)

// HelperTestSuite is a test suite for Question helper functions
type HelperTestSuite struct {
	suite.Suite
	controller *Controller
}

// TestHelperTestSuite runs the HelperTestSuite
func TestHelperTestSuite(t *testing.T) {
	suite.Run(t, new(HelperTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *HelperTestSuite) SetupTest() {
	mockQuestionPeer := mocks.NewMockQuestionPeer(suite.T())
	mockQuestionAnswerLogPeer := mocks.NewMockQuestionAnswerLogPeer(suite.T())
	suite.controller = New(mockQuestionPeer, mockQuestionAnswerLogPeer)
}
