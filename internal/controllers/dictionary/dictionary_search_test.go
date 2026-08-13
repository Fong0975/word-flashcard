package dictionary

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// TestSearchWordSuccess tests that SearchWord successfully handles a valid word request
func (suite *ControllerTestSuite) TestSearchWordSuccess() {
	// Create a test request to search for the word "hello"
	req := httptest.NewRequest("GET", "/api/dictionary/en-tw/hello", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	suite.router.ServeHTTP(recorder, req)

	// Verify the response status code is 200 OK
	suite.Equal(http.StatusOK, recorder.Code, "Dictionary search should respond with 200 OK")

	// Verify the response contains valid JSON matching the Cambridge response shape
	var response models.CambridgeResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Response should be valid JSON")

	suite.Equal("hello", response.Word)
	suite.ElementsMatch([]string{"exclamation", "noun"}, response.POS)
	suite.Empty(response.Verbs, "verbs are not scraped yet and should stay an empty array")
	suite.NotEmpty(response.Pronunciation, "Response should contain pronunciation")
	suite.NotEmpty(response.Definition, "Response should contain definitions")
	suite.Contains(response.Definition[0].Translation, "你好", "Definition should contain the Chinese translation")

	// Verify content type header
	suite.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}

// TestSearchWordUsesCache tests that a cached result is served without re-fetching
// from Cambridge Dictionary, by closing the mock origin after the first request and
// confirming the second request for the same word still succeeds from cache.
func (suite *ControllerTestSuite) TestSearchWordUsesCache() {
	firstReq := httptest.NewRequest("GET", "/api/dictionary/en-tw/hello", nil)
	firstRecorder := httptest.NewRecorder()
	suite.router.ServeHTTP(firstRecorder, firstReq)
	suite.Require().Equal(http.StatusOK, firstRecorder.Code, "first request should populate the cache")

	// Cut off the origin so a second, uncached fetch would fail. Nil out the
	// reference afterwards so TearDownTest doesn't double-close it.
	suite.mockCambridgeServer.Close()
	suite.mockCambridgeServer = nil

	secondReq := httptest.NewRequest("GET", "/api/dictionary/en-tw/hello", nil)
	secondRecorder := httptest.NewRecorder()
	suite.router.ServeHTTP(secondRecorder, secondReq)

	suite.Equal(http.StatusOK, secondRecorder.Code, "second request should be served from cache instead of hitting the now-closed origin")
	suite.Equal(firstRecorder.Body.String(), secondRecorder.Body.String(), "cached response body should match the original")
}

// TestSearchWordEmptyParameter tests that SearchWord rejects an empty word parameter
func (suite *ControllerTestSuite) TestSearchWordEmptyParameter() {
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest("GET", "/api/dictionary/en-tw/", nil)
	c.Params = gin.Params{
		{Key: "language", Value: "en-tw"},
		{Key: "word", Value: ""},
	}

	suite.controller.SearchWord(c)

	suite.Equal(http.StatusBadRequest, recorder.Code, "Empty word parameter should be rejected with 400 Bad Request")

	var response models.ErrorResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Error response should be valid JSON")
	suite.Equal(models.ErrCodeInvalidRequest, response.Code)
}

// TestSearchWordUnsupportedLanguage tests that SearchWord rejects a language slug
// that this controller does not know how to fetch
func (suite *ControllerTestSuite) TestSearchWordUnsupportedLanguage() {
	req := httptest.NewRequest("GET", "/api/dictionary/en/hello", nil)
	recorder := httptest.NewRecorder()

	suite.router.ServeHTTP(recorder, req)

	suite.Equal(http.StatusBadRequest, recorder.Code, "Unsupported language should respond with 400 Bad Request")

	var response models.ErrorResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Error response should be valid JSON")
	suite.Equal(models.ErrCodeInvalidRequest, response.Code)
}

// TestSearchWordNotFound tests that SearchWord handles word not found scenarios
func (suite *ControllerTestSuite) TestSearchWordNotFound() {
	// Create a test request for a word that doesn't exist in mock server
	req := httptest.NewRequest("GET", "/api/dictionary/en-tw/nonexistentword", nil)
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

// TestSearchWordUpstreamUnavailable tests that SearchWord maps a non-404 failure
// from Cambridge Dictionary (e.g. an origin server error) to 502 Bad Gateway
func (suite *ControllerTestSuite) TestSearchWordUpstreamUnavailable() {
	req := httptest.NewRequest("GET", "/api/dictionary/en-tw/upstreamerror", nil)
	recorder := httptest.NewRecorder()

	suite.router.ServeHTTP(recorder, req)

	suite.Equal(http.StatusBadGateway, recorder.Code, "Upstream failures should respond with 502 Bad Gateway")

	var response models.ErrorResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Error response should be valid JSON")
	suite.Equal(models.ErrCodeUpstreamUnavailable, response.Code)
}
