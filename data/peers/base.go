package peers

import (
	"fmt"
	"word-flashcard/utils/database"
)

// BasePeer provides common database operations for all peers
type BasePeer struct {
	db *database.UniversalDatabase
}

// NewBasePeer creates a new base peer with database connection
func NewBasePeer() (*BasePeer, error) {
	// Get database connection from the database package
	dbInstance, err := database.NewDatabaseFromEnv()
	if err != nil {
		return nil, err
	}

	if err := dbInstance.Connect(); err != nil {
		return nil, err
	}

	// Type assert to UniversalDatabase to access GetDB method
	universalDB, ok := dbInstance.(*database.UniversalDatabase)
	if !ok {
		return nil, fmt.Errorf("expected *database.UniversalDatabase, got %T", dbInstance)
	}

	return &BasePeer{
		db: universalDB,
	}, nil
}
