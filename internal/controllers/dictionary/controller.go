package dictionary

import (
	"sync"
	"time"
)

// Controller handles dictionary-related requests
type Controller struct {
	cache      map[string]CacheEntry
	cacheMutex sync.RWMutex
	cacheTTL   time.Duration
}

// CacheEntry represents a cached dictionary response
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
}

// New creates a new Controller instance
func New() *Controller {
	return &Controller{
		cache:    make(map[string]CacheEntry),
		cacheTTL: 30 * time.Minute,
	}
}
