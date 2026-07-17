package word

import (
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
)

// wordSortableColumns defines the columns allowed in sort query parameters for the words table.
var wordSortableColumns = []string{
	schema.WORD_ID,
	schema.WORD_WORD,
	schema.WORD_FAMILIARITY,
	schema.WORD_COUNT_PRACTISE,
	schema.COMMON_CREATED_AT,
}

// Controller handles word-related requests
type Controller struct {
	wordPeer            peers.WordPeerInterface
	wordDefinitionPeer  peers.WordDefinitionsPeerInterface
	wordPracticeLogPeer peers.WordPracticeLogPeerInterface
}

// New creates a new Controller instance
func New(wordPeer peers.WordPeerInterface, wordDefinition peers.WordDefinitionsPeerInterface, wordPracticeLogPeer peers.WordPracticeLogPeerInterface) *Controller {
	return &Controller{
		wordPeer:            wordPeer,
		wordDefinitionPeer:  wordDefinition,
		wordPracticeLogPeer: wordPracticeLogPeer,
	}
}

// GetReelPeers returns the real database peers
func GetReelPeers() (peers.WordPeerInterface, peers.WordDefinitionsPeerInterface, peers.WordPracticeLogPeerInterface, error) {
	wordPeer, err := peers.NewWordPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	wordDefinitionPeer, err := peers.NewWordDefinitionsPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	wordPracticeLogPeer, err := peers.NewWordPracticeLogPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	return wordPeer, wordDefinitionPeer, wordPracticeLogPeer, nil
}
