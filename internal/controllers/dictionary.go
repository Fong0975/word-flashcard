package controllers

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

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// DictionaryController handles dictionary-related requests
type DictionaryController struct {
	cache      map[string]CacheEntry
	cacheMutex sync.RWMutex
	cacheTTL   time.Duration
}

// CacheEntry represents a cached dictionary response
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
}

// NewDictionaryController creates a new DictionaryController instance
func NewDictionaryController() *DictionaryController {
	return &DictionaryController{
		cache:    make(map[string]CacheEntry),
		cacheTTL: 30 * time.Minute,
	}
}

// SearchWord handles dictionary lookup requests
// @Summary Search dictionary for word definition
// @Description Get dictionary definition and pronunciation for a given word from Cambridge Dictionary API
// @Tags dictionary
// @Accept json
// @Produce json
// @Param word path string true "Word to search for"
// @Success 200 {object} models.DictionaryResponse "Dictionary definition found successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid URL format or missing word parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Word not found, API error, or JSON encoding failure"
// @Router /api/dictionary/{word} [get]
func (dc *DictionaryController) SearchWord(c *gin.Context) {
	word := c.Param("word")

	// Validate word parameter
	if word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Word parameter is required"})
		return
	}

	// Check cache first
	cacheKey := fmt.Sprintf("dict_%s", strings.ReplaceAll(word, " ", "_"))
	if cached := dc.getFromCache(cacheKey); cached != nil {
		if response, ok := cached.(models.DictionaryResponse); ok {
			c.JSON(http.StatusOK, response)
			return
		}
	}

	// Fetch word data from Cambridge dictionary API
	response, err := dc.fetchWordDataFromCambridgeAPI(word)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error fetching word data: %v", err)})
		return
	}

	// Cache the result
	dc.setCache(cacheKey, *response)

	// Return response
	c.JSON(http.StatusOK, response)
}

// getFromCache retrieves data from the cache
func (dc *DictionaryController) getFromCache(key string) interface{} {
	dc.cacheMutex.RLock()
	defer dc.cacheMutex.RUnlock()

	entry, exists := dc.cache[key]
	if !exists {
		return nil
	}

	if time.Since(entry.Timestamp) > dc.cacheTTL {
		delete(dc.cache, key)
		return nil
	}

	return entry.Data
}

// setCache stores data in the cache
func (dc *DictionaryController) setCache(key string, data interface{}) {
	dc.cacheMutex.Lock()
	defer dc.cacheMutex.Unlock()

	dc.cache[key] = CacheEntry{
		Data:      data,
		Timestamp: time.Now(),
	}

	// Clean up old cache entries if cache size exceeds 1000
	if len(dc.cache) > 1000 {
		now := time.Now()
		for k, v := range dc.cache {
			if now.Sub(v.Timestamp) > dc.cacheTTL {
				delete(dc.cache, k)
			}
		}
	}
}

// fetchWordDataFromCambridgeAPI fetches word data from the Cambridge dictionary API
func (dc *DictionaryController) fetchWordDataFromCambridgeAPI(word string) (*models.DictionaryResponse, error) {
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
	var cambridgeResponse models.CambridgeResponse
	if err := json.Unmarshal(body, &cambridgeResponse); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Convert to our simplified format
	response := dc.convertCambridgeToOurFormat(cambridgeResponse)
	return response, nil
}

// convertCambridgeToOurFormat converts Cambridge dictionary API response to our simplified format
func (dc *DictionaryController) convertCambridgeToOurFormat(
	cambridgeResponse models.CambridgeResponse,
) *models.DictionaryResponse {
	var phonetics []models.PhoneticInfo
	var meanings []models.MeaningInfo

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
			phonetics = append(phonetics, models.PhoneticInfo{
				Language: langCode,
				Audio:    audioURL,
			})
			seenPronunciations[pronunciationKey] = true
		}
	}

	// Group definitions by part of speech
	meaningGroups := make(map[string][]models.DefinitionInfo)

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
			if len(exampleRunes) > 0 {
				exampleRunes[0] = unicode.ToUpper(exampleRunes[0])
				item.Text = string(exampleRunes)
			}

			if item.Translation != "" && item.Text != "" {
				combinedExamples = append(combinedExamples, fmt.Sprintf("%s %s", item.Text, item.Translation))
			} else {
				combinedExamples = append(combinedExamples, item.Text)
			}
		}

		// Sentences begin with capital letters for the definition
		definitionRunes := []rune(def.Text)
		if len(definitionRunes) > 0 {
			definitionRunes[0] = unicode.ToUpper(definitionRunes[0])
			def.Text = string(definitionRunes)
		}

		// Combine translation and text for definition
		var combinedDefinition string
		if def.Translation != "" && def.Text != "" {
			combinedDefinition = fmt.Sprintf("%s %s", def.Translation, def.Text)
		} else {
			combinedDefinition = def.Text
		}

		definition := models.DefinitionInfo{
			Definition: combinedDefinition,
			Example:    combinedExamples,
		}

		meaningGroups[partOfSpeech] = append(meaningGroups[partOfSpeech], definition)
	}

	// Convert grouped definitions to meanings
	for partOfSpeech, definitions := range meaningGroups {
		if len(definitions) > 0 {
			meanings = append(meanings, models.MeaningInfo{
				PartOfSpeech: partOfSpeech,
				Definitions:  definitions,
			})
		}
	}

	return &models.DictionaryResponse{
		Phonetics: phonetics,
		Meanings:  meanings,
	}
}
