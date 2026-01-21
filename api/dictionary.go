package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
	"unicode"
)

// Simplified data structures for the new free dictionary API
type DictionaryResponse struct {
	Phonetics []PhoneticInfo `json:"phonetics"`
	Meanings  []MeaningInfo  `json:"meanings"`
}

type PhoneticInfo struct {
	Language string `json:"language,omitempty"`
	Audio    string `json:"audio,omitempty"`
}

type MeaningInfo struct {
	PartOfSpeech string           `json:"partOfSpeech"`
	Definitions  []DefinitionInfo `json:"definitions"`
}

type DefinitionInfo struct {
	Definition string   `json:"definition"`
	Example    []string `json:"example,omitempty"`
}

// Cambridge Dictionary API response structures (for parsing)
type CambridgeResponse struct {
	Word          string                   `json:"word"`
	POS           []string                 `json:"pos"`
	Verbs         []CambridgeVerb          `json:"verbs"`
	Pronunciation []CambridgePronunciation `json:"pronunciation"`
	Definition    []CambridgeDefinition    `json:"definition"`
}

type CambridgeVerb struct {
	ID   int    `json:"id"`
	Type string `json:"type"`
	Text string `json:"text"`
}

type CambridgePronunciation struct {
	POS  string `json:"pos"`
	Lang string `json:"lang"`
	URL  string `json:"url"`
	Pron string `json:"pron"`
}

type CambridgeDefinition struct {
	ID          int                `json:"id"`
	POS         string             `json:"pos"`
	Text        string             `json:"text"`
	Translation string             `json:"translation"`
	Example     []CambridgeExample `json:"example"`
}

type CambridgeExample struct {
	ID          int    `json:"id"`
	Text        string `json:"text"`
	Translation string `json:"translation"`
}

// Cache system
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
}

var (
	cache      = make(map[string]CacheEntry)
	cacheMutex sync.RWMutex
	cacheTTL   = 30 * time.Minute
)

func (h *DictionaryHandler) Register(mux *http.ServeMux) {
	RegisterAPIMethod(mux, METHOD_GET, "dictionary/", h.dictionarySearch)
}

// dictionarySearch handles dictionary lookup requests
// @Summary Search dictionary for word definition
// @Description Get dictionary definition and pronunciation for a given word from Cambridge Dictionary API
// @Tags dictionary
// @Accept json
// @Produce json
// @Param word path string true "Word to search for"
// @Success 200 {object} DictionaryResponse "Dictionary definition found successfully"
// @Failure 400 {string} string "Bad request - Invalid URL format or missing word parameter"
// @Failure 500 {string} string "Internal server error - Word not found, API error, or JSON encoding failure"
// @Router /api/dictionary/{word} [get]
func (h *DictionaryHandler) dictionarySearch(w http.ResponseWriter, r *http.Request) {
	// Extract parameters from URL path
	path := r.URL.Path
	parts := strings.Split(path, "/")

	var word string

	// Support pattern: /api/dictionary/{word}
	if len(parts) == 4 {
		word = parts[3]
	} else {
		http.Error(w, "Invalid URL format. Use /api/dictionary/{word}", http.StatusBadRequest)
		return
	}

	// Validate word parameter
	if word == "" {
		http.Error(w, "Word parameter is required", http.StatusBadRequest)
		return
	}

	// Check cache first
	cacheKey := fmt.Sprintf("dict_%s", strings.ReplaceAll(word, " ", "_"))
	if cached := getFromCache(cacheKey); cached != nil {
		if response, ok := cached.(DictionaryResponse); ok {
			err := json.NewEncoder(w).Encode(response)
			if err != nil {
				return
			}
			return
		}
	}

	// Fetch word data from Cambridge dictionary API
	response, err := fetchWordDataFromCambridgeAPI(word)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching word data: %v", err), http.StatusInternalServerError)
		return
	}

	// Cache the result
	setCache(cacheKey, *response)

	// Return response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

// DictionaryHandler API module - dictionary lookup
type DictionaryHandler struct{}

// Cache management functions
func getFromCache(key string) interface{} {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	entry, exists := cache[key]
	if !exists {
		return nil
	}

	if time.Since(entry.Timestamp) > cacheTTL {
		delete(cache, key)
		return nil
	}

	return entry.Data
}

func setCache(key string, data interface{}) {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	cache[key] = CacheEntry{
		Data:      data,
		Timestamp: time.Now(),
	}

	// Clean up old cache entries if cache size exceeds 1000
	if len(cache) > 1000 {
		now := time.Now()
		for k, v := range cache {
			if now.Sub(v.Timestamp) > cacheTTL {
				delete(cache, k)
			}
		}
	}
}

// fetchWordDataFromCambridgeAPI fetches word data from the Cambridge dictionary API
func fetchWordDataFromCambridgeAPI(word string) (*DictionaryResponse, error) {
	// Validate and clean the input word
	word = strings.TrimSpace(word)
	if word == "" {
		return nil, fmt.Errorf("word cannot be empty")
	}

	// Get Cambridge API PORT from environment variable
	port := os.Getenv("CAMBRIDGE_API_PORT")
	if port == "" {
		port = "8081" // Default port
	}

	// Build Cambridge dictionary API URL
	apiURL := fmt.Sprintf("http://localhost:%s/api/dictionary/en-tw/%s", port, word)

	// Create simple HTTP client
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Make HTTP request
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("word '%s' not found", word)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned HTTP %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse JSON response
	var cambridgeResponse CambridgeResponse
	if err := json.Unmarshal(body, &cambridgeResponse); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Convert to our simplified format
	response := convertCambridgeToOurFormat(cambridgeResponse)
	return response, nil
}

// convertCambridgeToOurFormat converts Cambridge dictionary API response to our simplified format
func convertCambridgeToOurFormat(cambridgeResponse CambridgeResponse) *DictionaryResponse {
	var phonetics []PhoneticInfo
	var meanings []MeaningInfo

	// Collect phonetics from Cambridge response
	seenPronunciations := make(map[string]bool)
	for _, pron := range cambridgeResponse.Pronunciation {
		audioURL := pron.URL
		if audioURL == "" {
			continue
		}

		// Use the language from Cambridge response
		langCode := pron.Lang
		if langCode == "" {
			continue
		}

		// Ensure we don't add duplicate pronunciations
		pronunciationKey := fmt.Sprintf("%s_%s", langCode, audioURL)
		if !seenPronunciations[pronunciationKey] {
			phonetics = append(phonetics, PhoneticInfo{
				Language: langCode,
				Audio:    audioURL,
			})
			seenPronunciations[pronunciationKey] = true
		}
	}

	// Group definitions by part of speech
	meaningGroups := make(map[string][]DefinitionInfo)

	for _, def := range cambridgeResponse.Definition {
		partOfSpeech := def.POS
		if partOfSpeech == "" {
			partOfSpeech = "unknown"
		}

		// Combine translation and text for example
		var combinedExamples []string
		for _, item := range def.Example {
			// Sentences begin with capital letters for examples
			exampleRunes := []rune(item.Text)
			exampleRunes[0] = unicode.ToUpper(exampleRunes[0])
			item.Text = string(exampleRunes)

			if item.Translation != "" && item.Text != "" {
				combinedExamples = append(combinedExamples, fmt.Sprintf("%s %s", item.Text, item.Translation))
			} else {
				combinedExamples = append(combinedExamples, item.Text)
			}
		}

		// Sentences begin with capital letters for the definition
		definitionRunes := []rune(def.Text)
		definitionRunes[0] = unicode.ToUpper(definitionRunes[0])
		def.Text = string(definitionRunes)
		// Combine translation and text for definition
		var combinedDefinition string
		if def.Translation != "" && def.Text != "" {
			combinedDefinition = fmt.Sprintf("%s %s", def.Translation, def.Text)
		} else {
			combinedDefinition = def.Text
		}

		definition := DefinitionInfo{
			Definition: combinedDefinition,
			Example:    combinedExamples,
		}

		meaningGroups[partOfSpeech] = append(meaningGroups[partOfSpeech], definition)
	}

	// Convert grouped definitions to meanings
	for partOfSpeech, definitions := range meaningGroups {
		if len(definitions) > 0 {
			meanings = append(meanings, MeaningInfo{
				PartOfSpeech: partOfSpeech,
				Definitions:  definitions,
			})
		}
	}

	return &DictionaryResponse{
		Phonetics: phonetics,
		Meanings:  meanings,
	}
}
