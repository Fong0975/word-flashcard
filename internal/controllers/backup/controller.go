package backup

import (
	"word-flashcard/data/peers"
)

// Controller handles full-database export/import requests
type Controller struct {
	wordPeer              peers.WordPeerInterface
	wordDefinitionPeer    peers.WordDefinitionsPeerInterface
	questionPeer          peers.QuestionPeerInterface
	questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface
	wordPracticeLogPeer   peers.WordPracticeLogPeerInterface
	notePeer              peers.NotePeerInterface
	backupPeer            peers.BackupPeerInterface
}

// New creates a new Controller instance
func New(
	wordPeer peers.WordPeerInterface,
	wordDefinitionPeer peers.WordDefinitionsPeerInterface,
	questionPeer peers.QuestionPeerInterface,
	questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface,
	wordPracticeLogPeer peers.WordPracticeLogPeerInterface,
	notePeer peers.NotePeerInterface,
	backupPeer peers.BackupPeerInterface,
) *Controller {
	return &Controller{
		wordPeer:              wordPeer,
		wordDefinitionPeer:    wordDefinitionPeer,
		questionPeer:          questionPeer,
		questionAnswerLogPeer: questionAnswerLogPeer,
		wordPracticeLogPeer:   wordPracticeLogPeer,
		notePeer:              notePeer,
		backupPeer:            backupPeer,
	}
}

// GetReelPeers returns the real database peers
func GetReelPeers() (
	peers.WordPeerInterface,
	peers.WordDefinitionsPeerInterface,
	peers.QuestionPeerInterface,
	peers.QuestionAnswerLogPeerInterface,
	peers.WordPracticeLogPeerInterface,
	peers.NotePeerInterface,
	peers.BackupPeerInterface,
	error,
) {
	wordPeer, err := peers.NewWordPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	wordDefinitionPeer, err := peers.NewWordDefinitionsPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	questionPeer, err := peers.NewQuestionPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	questionAnswerLogPeer, err := peers.NewQuestionAnswerLogPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	wordPracticeLogPeer, err := peers.NewWordPracticeLogPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	notePeer, err := peers.NewNotePeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	backupPeer, err := peers.NewBackupPeer()
	if err != nil {
		return nil, nil, nil, nil, nil, nil, nil, err
	}

	return wordPeer, wordDefinitionPeer, questionPeer, questionAnswerLogPeer, wordPracticeLogPeer, notePeer, backupPeer, nil
}
