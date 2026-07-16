package dictionary

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode"

	"word-flashcard/internal/models"
)

// errWordNotFound marks a lookup for a word the upstream Cambridge dictionary
// service does not have, as opposed to the service being unreachable or failing.
var errWordNotFound = errors.New("word not found")

// fetchWordDataFromCambridgeAPI fetches word data from the Cambridge dictionary API
func (dc *Controller) fetchWordDataFromCambridgeAPI(word string) (*models.DictionaryResponse, error) {
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
		return nil, fmt.Errorf("%w: %s", errWordNotFound, word)
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
func (dc *Controller) convertCambridgeToOurFormat(
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
