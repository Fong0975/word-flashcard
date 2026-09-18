package dictionary

import (
	"log/slog"
	"net/http"
	"sync"
	"time"

	"word-flashcard/utils/config"
)

// defaultGeminiBaseURL is the origin called for Gemini API requests.
// Tests override Controller.geminiBaseURL with an httptest.Server URL instead of changing this default.
const defaultGeminiBaseURL = "https://generativelanguage.googleapis.com"

// defaultGeminiModel is used when GEMINI_MODEL is not set, so a future model
// rename upstream doesn't require a code change here.
const defaultGeminiModel = "gemini-flash-latest"

// geminiHTTPTimeout bounds how long a single Gemini API request may take.
// Generation is slower than a page fetch, so this is longer than a typical
// HTTP client timeout.
const geminiHTTPTimeout = 30 * time.Second

// Controller handles dictionary-related requests
type Controller struct {
	cache         map[string]CacheEntry
	cacheMutex    sync.RWMutex
	cacheTTL      time.Duration
	httpClient    *http.Client
	geminiBaseURL string
	geminiAPIKey  string
	geminiModel   string
}

// CacheEntry represents a cached dictionary response
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
}

// New creates a new Controller instance. GEMINI_API_KEY is read from the
// environment; if it is empty, a warning is logged at startup and lookups
// will fail at request time with a clear log message (the rest of the
// application does not depend on the dictionary feature, so this does not
// prevent the server from starting).
func New() *Controller {
	geminiAPIKey := config.GetOrDefault("GEMINI_API_KEY", "")
	if geminiAPIKey == "" {
		slog.Warn("GEMINI_API_KEY is not set; dictionary lookups will fail until it is configured")
	}

	return &Controller{
		cache:         make(map[string]CacheEntry),
		cacheTTL:      30 * time.Minute,
		httpClient:    &http.Client{Timeout: geminiHTTPTimeout},
		geminiBaseURL: defaultGeminiBaseURL,
		geminiAPIKey:  geminiAPIKey,
		geminiModel:   config.GetOrDefault("GEMINI_MODEL", defaultGeminiModel),
	}
}
