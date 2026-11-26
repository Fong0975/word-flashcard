package question

import (
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
)

// questionSortableColumns defines the columns allowed in sort query parameters for the questions table.
var questionSortableColumns = []string{
	schema.QUESTION_ID,
	schema.QUESTION_QUESTION,
	schema.QUESTION_ANSWER,
	schema.QUESTION_COUNT_PRACTISE,
	schema.QUESTION_COUNT_FAILURE_PRACTISE,
	schema.COMMON_CREATED_AT,
	schema.COMMON_UPDATED_AT,
}

// questionSearchableColumns defines the columns allowed as search filter keys for the questions table.
var questionSearchableColumns = []string{
	schema.QUESTION_QUESTION,
	schema.QUESTION_OPTION_A,
	schema.QUESTION_OPTION_B,
	schema.QUESTION_OPTION_C,
	schema.QUESTION_OPTION_D,
	schema.QUESTION_REMINDER,
}

// Controller handles question-related requests
type Controller struct {
	questionPeer          peers.QuestionPeerInterface
	questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface
}

// New creates a new Controller instance
func New(questionPeer peers.QuestionPeerInterface, questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface) *Controller {
	return &Controller{
		questionPeer:          questionPeer,
		questionAnswerLogPeer: questionAnswerLogPeer,
	}
}

// GetReelPeers returns the real database peers
func GetReelPeers() (peers.QuestionPeerInterface, peers.QuestionAnswerLogPeerInterface, error) {
	questionPeer, err := peers.NewQuestionPeer()
	if err != nil {
		return nil, nil, err
	}

	questionAnswerLogPeer, err := peers.NewQuestionAnswerLogPeer()
	if err != nil {
		return nil, nil, err
	}

	return questionPeer, questionAnswerLogPeer, nil
}
