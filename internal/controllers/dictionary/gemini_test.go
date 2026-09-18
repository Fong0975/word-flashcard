package dictionary

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// newTestControllerWithGeminiServer starts an httptest.Server driven by handler
// and returns a Controller pointed at it, plus a cleanup func to close the server.
func newTestControllerWithGeminiServer(handler http.HandlerFunc) (*Controller, func()) {
	server := httptest.NewServer(handler)
	controller := New()
	controller.geminiBaseURL = server.URL
	return controller, server.Close
}

// geminiEnvelopeJSON marshals a geminiGenerateContentResponse wrapping
// payloadJSON as its first candidate/part text, for tests that need to hand
// fetchWordDataFromGemini/parseGeminiResponse a realistic response body.
func geminiEnvelopeJSON(payloadJSON string) []byte {
	envelope := geminiGenerateContentResponse{
		Candidates: []geminiCandidate{
			{Content: geminiResponseContent{Parts: []geminiResponsePart{{Text: payloadJSON}}}},
		},
	}
	body, _ := json.Marshal(envelope)
	return body
}

// TestFetchWordDataFromGemini tests fetchWordDataFromGemini across input
// validation, HTTP failure modes and a successful structured-output lookup.
func (suite *ControllerTestSuite) TestFetchWordDataFromGemini() {
	tests := []struct {
		name                 string
		word                 string
		language             string
		unreachable          bool
		emptyAPIKey          bool
		handler              http.HandlerFunc
		wantErrIs            error
		wantErrContains      string
		wantWord             string
		wantPOS              []string
		wantDefinitionLen    int
		wantPronunciationLen int
	}{
		{
			name:     "returns parsed word data for a supported language and known word",
			word:     "hello",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Equal("test-api-key", r.Header.Get("x-goog-api-key"))
				suite.Empty(r.URL.RawQuery, "the API key must never be sent as a URL query parameter")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(geminiEnvelopeJSON(helloGeminiPayloadJSON))
			},
			wantWord:             "hello",
			wantPOS:              []string{"exclamation", "noun"},
			wantDefinitionLen:    2,
			wantPronunciationLen: 0,
		},
		{
			name:     "returns an error without making an HTTP request when the word is blank",
			word:     "   ",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Fail("a blank word should be rejected before an HTTP request is made")
			},
			wantErrContains: "word cannot be empty",
		},
		{
			name:     "returns errUnsupportedLanguage without making an HTTP request",
			word:     "hello",
			language: "en",
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Fail("unsupported language should be rejected before an HTTP request is made")
			},
			wantErrIs: errUnsupportedLanguage,
		},
		{
			name:        "returns a configuration error without making an HTTP request when the API key is empty",
			word:        "hello",
			language:    "en-tw",
			emptyAPIKey: true,
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Fail("a request should never be sent without an API key")
			},
			wantErrContains: "dictionary service is not configured",
		},
		{
			name:     "returns errWordNotFound when Gemini reports the word was not found",
			word:     "zzzznotaword",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(geminiEnvelopeJSON(notFoundGeminiPayloadJSON))
			},
			wantErrIs: errWordNotFound,
		},
		{
			name:     "returns a generic error when Gemini responds with a server error",
			word:     "hello",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
			},
			wantErrContains: "HTTP 500",
		},
		{
			name:        "returns a generic error when the origin is unreachable",
			word:        "hello",
			language:    "en-tw",
			unreachable: true,
			wantErrContains: "failed to fetch dictionary data",
		},
		{
			name:     "returns a parse error when the response body is not valid JSON",
			word:     "hello",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("not json"))
			},
			wantErrContains: "failed to parse Gemini response",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			var controller *Controller
			if tt.unreachable {
				controller = New()
				controller.geminiBaseURL = "http://127.0.0.1:1"
			} else {
				var closeServer func()
				controller, closeServer = newTestControllerWithGeminiServer(tt.handler)
				defer closeServer()
			}
			if tt.emptyAPIKey {
				controller.geminiAPIKey = ""
			}

			response, err := controller.fetchWordDataFromGemini(tt.word, tt.language)

			switch {
			case tt.wantErrIs != nil:
				suite.Require().Error(err)
				suite.True(errors.Is(err, tt.wantErrIs), "expected error to wrap %v, got %v", tt.wantErrIs, err)
			case tt.wantErrContains != "":
				suite.Require().Error(err)
				suite.Contains(err.Error(), tt.wantErrContains)
			default:
				suite.Require().NoError(err)
				suite.Equal(tt.wantWord, response.Word)
				suite.ElementsMatch(tt.wantPOS, response.POS)
				suite.Empty(response.Verbs)
				suite.Len(response.Pronunciation, tt.wantPronunciationLen)
				suite.Len(response.Definition, tt.wantDefinitionLen)
			}
		})
	}
}

// TestBuildGeminiRequestBody tests that buildGeminiRequestBody embeds the word
// and target language into the prompt and attaches the structured-output schema.
func (suite *ControllerTestSuite) TestBuildGeminiRequestBody() {
	tests := []struct {
		name           string
		word           string
		targetLanguage string
	}{
		{name: "builds a request for a simple word", word: "abide", targetLanguage: "Traditional Chinese (Taiwan)"},
		{name: "builds a request for a word containing special characters", word: "e-mail", targetLanguage: "Traditional Chinese (Taiwan)"},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			body, err := buildGeminiRequestBody(tt.word, tt.targetLanguage)
			suite.Require().NoError(err)

			var reqBody geminiRequestBody
			suite.Require().NoError(json.Unmarshal(body, &reqBody))

			suite.Require().Len(reqBody.Contents, 1)
			suite.Require().Len(reqBody.Contents[0].Parts, 1)
			prompt := reqBody.Contents[0].Parts[0].Text
			suite.Contains(prompt, tt.word)
			suite.Contains(prompt, tt.targetLanguage)

			suite.Equal("application/json", reqBody.GenerationConfig.ResponseMIMEType)
			schema := reqBody.GenerationConfig.ResponseSchema
			suite.Equal("OBJECT", schema.Type)
			suite.ElementsMatch([]string{"found", "word", "pos", "definitions"}, schema.Required)
			suite.Contains(schema.Properties, "found")
			suite.Contains(schema.Properties, "word")
			suite.Contains(schema.Properties, "pos")
			suite.Contains(schema.Properties, "definitions")
		})
	}
}

// TestNewGeminiUpstreamError tests that newGeminiUpstreamError keeps a stable
// public "HTTP <status>" message while attaching the request URL, the
// Retry-After header and a whitespace-collapsed body snippet as log-only
// detail, and never includes the API key (which is sent as a header the
// caller never passes into this function).
func (suite *ControllerTestSuite) TestNewGeminiUpstreamError() {
	endpoint := "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

	tests := []struct {
		name       string
		headers    map[string]string
		body       string
		wantDetail []any
	}{
		{
			name: "captures the Retry-After header and collapses a multi-line body into one snippet",
			headers: map[string]string{
				"Retry-After": "30",
			},
			body: "Quota exceeded.\n\nPlease retry after some time.",
			wantDetail: []any{
				"url", endpoint,
				"retry_after", "30",
				"body_snippet", "Quota exceeded. Please retry after some time.",
			},
		},
		{
			name:    "leaves the header and body snippet empty when the response has none",
			headers: map[string]string{},
			body:    "",
			wantDetail: []any{
				"url", endpoint,
				"retry_after", "",
				"body_snippet", "",
			},
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for k, v := range tt.headers {
					w.Header().Set(k, v)
				}
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(tt.body))
			}))
			defer server.Close()

			resp, err := http.Get(server.URL)
			suite.Require().NoError(err)
			defer resp.Body.Close()

			gotErr := newGeminiUpstreamError(endpoint, resp)

			suite.EqualError(gotErr, "gemini request returned HTTP 429")

			var de *common.DetailedError
			suite.Require().True(errors.As(gotErr, &de))
			suite.Equal(tt.wantDetail, de.LogDetail())

			for _, detail := range de.LogDetail() {
				if s, ok := detail.(string); ok {
					suite.NotContains(s, "test-api-key")
				}
			}
		})
	}
}

// TestParseGeminiResponse tests that parseGeminiResponse decodes a Gemini
// generateContent response's nested JSON payload into the dictionary API's
// response shape, and rejects malformed or "not found" payloads.
func (suite *ControllerTestSuite) TestParseGeminiResponse() {
	tests := []struct {
		name      string
		body      []byte
		wantErrIs error
		wantErr   string
		want      *models.CambridgeResponse
	}{
		{
			name: "maps a found word into the dictionary response shape",
			body: geminiEnvelopeJSON(helloGeminiPayloadJSON),
			want: &models.CambridgeResponse{
				Word:          "hello",
				POS:           []string{"exclamation", "noun"},
				Verbs:         []models.CambridgeVerb{},
				Pronunciation: []models.CambridgePronunciation{},
				Definition: []models.CambridgeDefinition{
					{
						ID:          0,
						POS:         "exclamation",
						Text:        "used when meeting or greeting someone",
						Translation: "喂，你好",
						Example: []models.CambridgeExample{
							{ID: 0, Text: "Hello, Paul.", Translation: "你好，保羅。"},
						},
					},
					{
						ID:          1,
						POS:         "noun",
						Text:        "something that is said to attract someone's attention",
						Translation: "（引起別人注意的招呼語）",
						Example:     []models.CambridgeExample{},
					},
				},
			},
		},
		{
			name:      "returns errWordNotFound when Gemini reports the word was not found",
			body:      geminiEnvelopeJSON(notFoundGeminiPayloadJSON),
			wantErrIs: errWordNotFound,
		},
		{
			name:    "returns an error when the response envelope is not valid JSON",
			body:    []byte("not json"),
			wantErr: "failed to parse Gemini response",
		},
		{
			name:    "returns an error when the response has no candidates",
			body:    []byte(`{"candidates": []}`),
			wantErr: "gemini response contained no candidates",
		},
		{
			name:    "returns an error when the dictionary payload is not valid JSON",
			body:    geminiEnvelopeJSON("not json"),
			wantErr: "failed to parse Gemini dictionary payload",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			response, err := parseGeminiResponse(tt.body, "hello")

			switch {
			case tt.wantErrIs != nil:
				suite.Require().Error(err)
				suite.True(errors.Is(err, tt.wantErrIs))
				suite.Nil(response)
			case tt.wantErr != "":
				suite.Require().Error(err)
				suite.Contains(err.Error(), tt.wantErr)
				suite.Nil(response)
			default:
				suite.Require().NoError(err)
				suite.Equal(tt.want, response)
			}
		})
	}
}
