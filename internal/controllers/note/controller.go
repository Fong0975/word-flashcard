package note

import (
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
)

// noteSortableColumns defines the columns allowed in sort query parameters for the notes table.
var noteSortableColumns = []string{
	schema.NOTE_ID,
	schema.NOTE_TITLE,
	schema.NOTE_SORT_ORDER,
	schema.COMMON_CREATED_AT,
	schema.COMMON_UPDATED_AT,
}

// Controller handles note-related requests
type Controller struct {
	notePeer peers.NotePeerInterface
}

// New creates a new Controller instance
func New(notePeer peers.NotePeerInterface) *Controller {
	return &Controller{notePeer: notePeer}
}

// GetReelPeer returns the real database peer for notes
func GetReelPeer() (peers.NotePeerInterface, error) {
	return peers.NewNotePeer()
}
