package dictionary

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/models"
)

// TestSearchWordSuccess tests that SearchWord successfully handles a valid word request
func (suite *ControllerTestSuite) TestSearchWordSuccess() {
	// Create a test request to search for the word "hello"
	req := httptest.NewRequest("GET", "/api/dictionary/hello", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	suite.router.ServeHTTP(recorder, req)

	// Verify the response status code is 200 OK
	suite.Equal(http.StatusOK, recorder.Code, "Dictionary search should respond with 200 OK")

	// Verify the response contains valid JSON
	var response models.DictionaryResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Response should be valid JSON")

	// Verify the response structure contains expected data
	suite.NotEmpty(response.Phonetics, "Response should contain phonetics")
	suite.NotEmpty(response.Meanings, "Response should contain meanings")

	// Verify phonetics data
	suite.Equal("en", response.Phonetics[0].Language, "First phonetic should have language 'en'")
	suite.Contains(response.Phonetics[0].Audio, "hello.mp3", "Audio URL should contain 'hello.mp3'")

	// Verify meanings data
	suite.Equal("noun", response.Meanings[0].PartOfSpeech, "First meaning should be part of speech 'noun'")
	suite.NotEmpty(response.Meanings[0].Definitions, "Meaning should contain definitions")
	suite.Contains(response.Meanings[0].Definitions[0].Definition, "問候", "Definition should contain Chinese translation")

	// Verify content type header
	suite.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}

// TestSearchWordEmptyParameter tests that SearchWord handles empty word parameter correctly
func (suite *ControllerTestSuite) TestSearchWordEmptyParameter() {
	// Create a test request with empty word parameter
	req := httptest.NewRequest("GET", "/api/dictionary/", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	suite.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 404 Not Found (gin route doesn't match)
	suite.Equal(http.StatusNotFound, recorder.Code, "Empty word parameter should result in 404 Not Found")
}

// TestSearchWordNotFound tests that SearchWord handles word not found scenarios
func (suite *ControllerTestSuite) TestSearchWordNotFound() {
	// Create a test request for a word that doesn't exist in mock server
	req := httptest.NewRequest("GET", "/api/dictionary/nonexistentword", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	suite.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 404 Not Found
	suite.Equal(http.StatusNotFound, recorder.Code, "Word not found should respond with 404")

	// Verify error response format
	var response models.ErrorResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Error response should be valid JSON")
	suite.Contains(response.Error, "not found", "Error message should mention the word was not found")
	suite.Equal(models.ErrCodeNotFound, response.Code, "Error code should be not_found")
}
