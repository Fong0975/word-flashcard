package dictionary

import (
	"net/http"
	"sync"
	"time"
)

// defaultCambridgeBaseURL is the origin scraped for dictionary pages.
// Tests override Controller.cambridgeBaseURL with an httptest.Server URL instead of changing this default.
const defaultCambridgeBaseURL = "https://dictionary.cambridge.org"

// cambridgeHTTPTimeout bounds how long a single scrape request may take.
const cambridgeHTTPTimeout = 10 * time.Second

// Controller handles dictionary-related requests
type Controller struct {
	cache            map[string]CacheEntry
	cacheMutex       sync.RWMutex
	cacheTTL         time.Duration
	httpClient       *http.Client
	cambridgeBaseURL string
}

// CacheEntry represents a cached dictionary response
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
}

// New creates a new Controller instance
func New() *Controller {
	return &Controller{
		cache:            make(map[string]CacheEntry),
		cacheTTL:         30 * time.Minute,
		httpClient:       &http.Client{Timeout: cambridgeHTTPTimeout},
		cambridgeBaseURL: defaultCambridgeBaseURL,
	}
}
