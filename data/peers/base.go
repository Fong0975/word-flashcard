package peers

import (
	"database/sql"
	"fmt"
	"word-flashcard/utils/database"
)

// BasePeer provides common database operations for all peers
type BasePeer struct {
	db *sql.DB
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
		db: universalDB.GetDB(),
	}, nil
}

// GetDB returns the database connection
func (bp *BasePeer) GetDB() *sql.DB {
	return bp.db
}

// Close closes the database connection
func (bp *BasePeer) Close() error {
	if bp.db != nil {
		return bp.db.Close()
	}
	return nil
}
