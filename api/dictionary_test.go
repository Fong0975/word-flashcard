package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

// Mock Cambridge API response data based on garage.json
const mockCambridgeResponse = `{
	"word": "garage",
	"pos": ["noun", "verb"],
	"verbs": [
		{"id": 0, "type": "Singular", "text": "garage"},
		{"id": 1, "type": "Plural", "text": "garages"}
	],
	"pronunciation": [
		{
			"pos": "noun",
			"lang": "uk",
			"url": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/uk_pron/u/ukg/ukgan/ukganja011.mp3",
			"pron": "/ˈɡær.ɑːʒ/"
		},
		{
			"pos": "noun",
			"lang": "us",
			"url": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/us_pron/g/gar/garag/garage.mp3",
			"pron": "/ɡəˈrɑːʒ/"
		},
		{
			"pos": "verb [ T ]",
			"lang": "uk",
			"url": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/uk_pron/u/ukg/ukgan/ukganja011.mp3",
			"pron": "/ˈɡær.ɑːʒ/"
		},
		{
			"pos": "verb [ T ]",
			"lang": "us",
			"url": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/us_pron/g/gar/garag/garage.mp3",
			"pron": "/ɡəˈrɑːʒ/"
		}
	],
	"definition": [
		{
			"id": 0,
			"pos": "noun",
			"text": "a building where a car is kept, built next to or as part of a house",
			"translation": "車庫，汽車房",
			"example": [
				{
					"id": 0,
					"text": "Did you put the car in the garage?",
					"translation": "你把車停到車庫裡了嗎？"
				}
			]
		},
		{
			"id": 1,
			"pos": "noun",
			"text": "a place where cars are repaired",
			"translation": "汽車修理廠",
			"example": [
				{
					"id": 0,
					"text": "The car's still at the garage getting fixed.",
					"translation": "車還在汽車修理廠維修呢。"
				}
			]
		},
		{
			"id": 2,
			"pos": "noun",
			"text": "a place where fuel is sold for cars and other vehicles",
			"translation": "加油站",
			"example": []
		},
		{
			"id": 3,
			"pos": "noun",
			"text": "a place where cars are sold",
			"translation": "銷售汽車的地方",
			"example": []
		},
		{
			"id": 4,
			"pos": "noun",
			"text": "fast, electronic dance music with a strong beat, keyboards, and singing",
			"translation": "車庫樂（一種鍵盤樂器伴奏演唱的快節奏電子舞曲）",
			"example": []
		},
		{
			"id": 5,
			"pos": "verb",
			"text": "to put or keep a vehicle in a garage",
			"translation": "把車停在車庫裡",
			"example": [
				{
					"id": 0,
					"text": "If your car is garaged, you get much cheaper insurance.",
					"translation": "如果你把車停放在車庫裡，你買汽車保險時就能省很多錢。"
				}
			]
		}
	]
}`

// Test convertCambridgeToOurFormat function
func TestConvertCambridgeToOurFormat(t *testing.T) {
	// Parse mock Cambridge response
	var cambridgeResponse CambridgeResponse
	err := json.Unmarshal([]byte(mockCambridgeResponse), &cambridgeResponse)
	if err != nil {
		t.Fatalf("Failed to unmarshal mock Cambridge response: %v", err)
	}

	// Convert to our format
	result := convertCambridgeToOurFormat(cambridgeResponse)

	// Test phonetics
	if len(result.Phonetics) == 0 {
		t.Error("Expected phonetics to be present")
	}

	// Check for UK and US pronunciations
	hasUK := false
	hasUS := false
	for _, phonetic := range result.Phonetics {
		if phonetic.Language == "uk" {
			hasUK = true
			expectedURL := "https://dictionary.cambridge.org/us/media/english-chinese-traditional/uk_pron/u/ukg/ukgan/ukganja011.mp3"
			if phonetic.Audio != expectedURL {
				t.Errorf("Expected UK audio URL %s, got %s", expectedURL, phonetic.Audio)
			}
		}
		if phonetic.Language == "us" {
			hasUS = true
			expectedURL := "https://dictionary.cambridge.org/us/media/english-chinese-traditional/us_pron/g/gar/garag/garage.mp3"
			if phonetic.Audio != expectedURL {
				t.Errorf("Expected US audio URL %s, got %s", expectedURL, phonetic.Audio)
			}
		}
	}

	if !hasUK {
		t.Error("Expected UK pronunciation to be present")
	}
	if !hasUS {
		t.Error("Expected US pronunciation to be present")
	}

	// Test meanings
	if len(result.Meanings) == 0 {
		t.Error("Expected meanings to be present")
	}

	// Check for noun and verb meanings
	hasNoun := false
	hasVerb := false
	for _, meaning := range result.Meanings {
		if meaning.PartOfSpeech == "noun" {
			hasNoun = true
			// Check that we have multiple definitions for noun
			if len(meaning.Definitions) < 2 {
				t.Error("Expected multiple definitions for noun")
			}
			// Test first definition
			firstDef := meaning.Definitions[0]
			expectedDef := "車庫，汽車房 A building where a car is kept, built next to or as part of a house"
			if firstDef.Definition != expectedDef {
				t.Errorf("Expected definition: %s, got: %s", expectedDef, firstDef.Definition)
			}
			// Test examples
			if len(firstDef.Example) == 0 {
				t.Error("Expected examples for first noun definition")
			}
			expectedExample := "Did you put the car in the garage? 你把車停到車庫裡了嗎？"
			if firstDef.Example[0] != expectedExample {
				t.Errorf("Expected example: %s, got: %s", expectedExample, firstDef.Example[0])
			}
		}
		if meaning.PartOfSpeech == "verb" {
			hasVerb = true
			// Check that we have verb definition
			if len(meaning.Definitions) == 0 {
				t.Error("Expected verb definitions")
			}
			verbDef := meaning.Definitions[0]
			expectedDef := "把車停在車庫裡 To put or keep a vehicle in a garage"
			if verbDef.Definition != expectedDef {
				t.Errorf("Expected verb definition: %s, got: %s", expectedDef, verbDef.Definition)
			}
		}
	}

	if !hasNoun {
		t.Error("Expected noun meaning to be present")
	}
	if !hasVerb {
		t.Error("Expected verb meaning to be present")
	}
}

// Test DictionaryHandler with mocked Cambridge API
func TestDictionaryHandler(t *testing.T) {
	// Create a mock Cambridge API server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check the request path
		if strings.Contains(r.URL.Path, "/api/dictionary/en-tw/garage") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, err := w.Write([]byte(mockCambridgeResponse))
			if err != nil {
				return 
			}
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	// Extract port from mock server URL
	serverParts := strings.Split(mockServer.URL, ":")
	port := serverParts[len(serverParts)-1]

	// Set the environment variable to use our mock server
	originalPort := os.Getenv("CAMBRIDGE_API_PORT")
	os.Setenv("CAMBRIDGE_API_PORT", port)
	defer os.Setenv("CAMBRIDGE_API_PORT", originalPort)

	// Create a request to our dictionary handler
	req := httptest.NewRequest("GET", "/api/dictionary/garage", nil)
	w := httptest.NewRecorder()

	// Call the handler
	DictionaryHandler(w, req)

	// Check response status
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Check content type
	expectedContentType := "application/json"
	if w.Header().Get("Content-Type") != expectedContentType {
		t.Errorf("Expected content type %s, got %s", expectedContentType, w.Header().Get("Content-Type"))
	}

	// Check CORS header
	expectedCORS := "*"
	if w.Header().Get("Access-Control-Allow-Origin") != expectedCORS {
		t.Errorf("Expected CORS header %s, got %s", expectedCORS, w.Header().Get("Access-Control-Allow-Origin"))
	}

	// Parse response body
	var response DictionaryResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response structure
	if len(response.Phonetics) == 0 {
		t.Error("Expected phonetics in response")
	}

	if len(response.Meanings) == 0 {
		t.Error("Expected meanings in response")
	}

	// Test specific data
	hasUKAudio := false
	for _, phonetic := range response.Phonetics {
		if phonetic.Language == "uk" && phonetic.Audio != "" {
			hasUKAudio = true
			break
		}
	}
	if !hasUKAudio {
		t.Error("Expected UK audio in response")
	}
}

// Test DictionaryHandler with invalid URL format
func TestDictionaryHandlerInvalidURL(t *testing.T) {
	// Test various invalid URL formats
	testCases := []struct {
		path           string
		expectedStatus int
	}{
		{"/api/dictionary/", http.StatusBadRequest},
		{"/api/dictionary", http.StatusBadRequest},
		{"/api/", http.StatusBadRequest},
		{"/api/dictionary/word/extra", http.StatusBadRequest},
	}

	for _, tc := range testCases {
		req := httptest.NewRequest("GET", tc.path, nil)
		w := httptest.NewRecorder()

		DictionaryHandler(w, req)

		if w.Code != tc.expectedStatus {
			t.Errorf("For path %s, expected status %d, got %d", tc.path, tc.expectedStatus, w.Code)
		}
	}
}

// Test DictionaryHandler with empty word parameter
func TestDictionaryHandlerEmptyWord(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/dictionary/", nil)
	w := httptest.NewRecorder()

	DictionaryHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for empty word, got %d", http.StatusBadRequest, w.Code)
	}
}

// Test cache functionality
func TestCacheOperations(t *testing.T) {
	// Clear cache for clean test
	cache = make(map[string]CacheEntry)

	testKey := "test_key"
	testData := "test_data"

	// Test cache miss
	result := getFromCache(testKey)
	if result != nil {
		t.Error("Expected cache miss, got data")
	}

	// Test cache set and get
	setCache(testKey, testData)
	result = getFromCache(testKey)
	if result != testData {
		t.Errorf("Expected %s from cache, got %v", testData, result)
	}

	// Test cache expiry (simulate old entry)
	cache[testKey] = CacheEntry{
		Data:      testData,
		Timestamp: time.Now().Add(-2 * cacheTTL), // Make it expired
	}

	result = getFromCache(testKey)
	if result != nil {
		t.Error("Expected expired cache entry to return nil")
	}

	// Verify expired entry was cleaned up
	if _, exists := cache[testKey]; exists {
		t.Error("Expected expired cache entry to be deleted")
	}
}

// Test DictionaryHandler with Cambridge API error
func TestDictionaryHandlerAPIError(t *testing.T) {
	// Create a mock server that returns error
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer mockServer.Close()

	// Extract port from mock server URL
	serverParts := strings.Split(mockServer.URL, ":")
	port := serverParts[len(serverParts)-1]

	// Set the environment variable to use our mock server
	originalPort := os.Getenv("CAMBRIDGE_API_PORT")
	os.Setenv("CAMBRIDGE_API_PORT", port)
	defer os.Setenv("CAMBRIDGE_API_PORT", originalPort)

	// Clear cache to ensure we hit the API
	cache = make(map[string]CacheEntry)

	req := httptest.NewRequest("GET", "/api/dictionary/test", nil)
	w := httptest.NewRecorder()

	DictionaryHandler(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status %d for API error, got %d", http.StatusInternalServerError, w.Code)
	}
}

// Test DictionaryHandler with word not found
func TestDictionaryHandlerWordNotFound(t *testing.T) {
	// Create a mock server that returns 404
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockServer.Close()

	// Extract port from mock server URL
	serverParts := strings.Split(mockServer.URL, ":")
	port := serverParts[len(serverParts)-1]

	// Set the environment variable to use our mock server
	originalPort := os.Getenv("CAMBRIDGE_API_PORT")
	os.Setenv("CAMBRIDGE_API_PORT", port)
	defer os.Setenv("CAMBRIDGE_API_PORT", originalPort)

	// Clear cache to ensure we hit the API
	cache = make(map[string]CacheEntry)

	req := httptest.NewRequest("GET", "/api/dictionary/nonexistentword", nil)
	w := httptest.NewRecorder()

	DictionaryHandler(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status %d for word not found, got %d", http.StatusInternalServerError, w.Code)
	}
}