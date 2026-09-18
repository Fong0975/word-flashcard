package dictionary

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// errWordNotFound marks a lookup for a word Gemini does not recognize as a
// real English word, as opposed to the request failing outright.
var errWordNotFound = errors.New("word not found")

// errUnsupportedLanguage marks a language slug this controller does not know how to fetch.
var errUnsupportedLanguage = errors.New("unsupported language")

// supportedLanguages maps a slug language (e.g. "en-tw") to the human-readable
// target language description used in the Gemini prompt. Only en-tw is
// implemented for now, but the map keeps the route contract ready for the
// rest (en, uk, en-cn) to be added later without a breaking change.
var supportedLanguages = map[string]string{
	"en-tw": "Traditional Chinese (Taiwan)",
}

// maxDiagnosticBodySnippetBytes caps how much of an unexpected upstream response
// body is captured for diagnostics, so a large error page doesn't bloat the log.
const maxDiagnosticBodySnippetBytes = 500

// geminiPromptTemplate asks Gemini to look up word and return JSON matching
// geminiResponseSchema. It is intentionally strict about the target language
// and about favoring common/TOEIC-level usage, since this app is a TOEIC
// vocabulary flashcard tool.
const geminiPromptTemplate = `You are a bilingual English-%s dictionary assistant for a TOEIC vocabulary flashcard app.
Look up the English word "%s".
If it is not a real English word, set "found" to false and leave the other fields empty.
If it is a real English word, set "found" to true and provide:
- "word": the word itself, lowercase unless it is a proper noun.
- "pos": the distinct parts of speech this word can take (e.g. "noun", "verb", "adjective").
- "definitions": one entry per distinct sense, each with:
  - "pos": the part of speech for this sense.
  - "text": a concise English definition.
  - "translation": a natural %s translation of the definition.
  - "examples": one or two example sentences in English with their %s translations, prioritizing common, everyday or TOEIC-level usage.
Respond only with JSON matching the provided schema.`

// geminiSchemaProperty is a (subset of) JSON Schema/OpenAPI Schema Object, the
// format Gemini's generationConfig.responseSchema expects, used to constrain
// Gemini's output to the shape parseGeminiResponse understands.
type geminiSchemaProperty struct {
	Type       string                          `json:"type"`
	Items      *geminiSchemaProperty           `json:"items,omitempty"`
	Properties map[string]geminiSchemaProperty `json:"properties,omitempty"`
	Required   []string                        `json:"required,omitempty"`
}

// geminiResponseSchema constrains Gemini's structured output to a shape
// buildGeminiRequestBody's prompt describes and parseGeminiResponse decodes.
var geminiResponseSchema = geminiSchemaProperty{
	Type:     "OBJECT",
	Required: []string{"found", "word", "pos", "definitions"},
	Properties: map[string]geminiSchemaProperty{
		"found": {Type: "BOOLEAN"},
		"word":  {Type: "STRING"},
		"pos": {
			Type:  "ARRAY",
			Items: &geminiSchemaProperty{Type: "STRING"},
		},
		"definitions": {
			Type: "ARRAY",
			Items: &geminiSchemaProperty{
				Type:     "OBJECT",
				Required: []string{"pos", "text", "translation", "examples"},
				Properties: map[string]geminiSchemaProperty{
					"pos":         {Type: "STRING"},
					"text":        {Type: "STRING"},
					"translation": {Type: "STRING"},
					"examples": {
						Type: "ARRAY",
						Items: &geminiSchemaProperty{
							Type:     "OBJECT",
							Required: []string{"text", "translation"},
							Properties: map[string]geminiSchemaProperty{
								"text":        {Type: "STRING"},
								"translation": {Type: "STRING"},
							},
						},
					},
				},
			},
		},
	},
}

// geminiRequestBody is the request payload for the Gemini generateContent API.
type geminiRequestBody struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig geminiGenerationConfig `json:"generationConfig"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	ResponseMIMEType string               `json:"responseMimeType"`
	ResponseSchema   geminiSchemaProperty `json:"responseSchema"`
}

// geminiGenerateContentResponse is the response envelope from the Gemini
// generateContent API; the actual dictionary payload is JSON-encoded text
// nested inside it (see parseGeminiResponse).
type geminiGenerateContentResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
}

type geminiCandidate struct {
	Content geminiResponseContent `json:"content"`
}

type geminiResponseContent struct {
	Parts []geminiResponsePart `json:"parts"`
}

type geminiResponsePart struct {
	Text string `json:"text"`
}

// geminiWordPayload is the dictionary payload Gemini returns, JSON-encoded as
// the text of the first response part, matching geminiResponseSchema.
type geminiWordPayload struct {
	Found       bool                      `json:"found"`
	Word        string                    `json:"word"`
	POS         []string                  `json:"pos"`
	Definitions []geminiDefinitionPayload `json:"definitions"`
}

type geminiDefinitionPayload struct {
	POS         string                 `json:"pos"`
	Text        string                 `json:"text"`
	Translation string                 `json:"translation"`
	Examples    []geminiExamplePayload `json:"examples"`
}

type geminiExamplePayload struct {
	Text        string `json:"text"`
	Translation string `json:"translation"`
}

// fetchWordDataFromGemini asks Gemini to look up word and parses its
// structured JSON output into the response shape returned by the dictionary
// API. The pronunciation field is always left empty: Gemini is a text model
// and cannot provide real pronunciation audio, so the frontend falls back to
// the browser's built-in speech synthesis instead.
func (dc *Controller) fetchWordDataFromGemini(word, slugLanguage string) (*models.CambridgeResponse, error) {
	word = strings.TrimSpace(word)
	if word == "" {
		return nil, fmt.Errorf("word cannot be empty")
	}

	targetLanguage, ok := supportedLanguages[slugLanguage]
	if !ok {
		return nil, fmt.Errorf("%w: %s", errUnsupportedLanguage, slugLanguage)
	}

	if dc.geminiAPIKey == "" {
		return nil, common.NewDetailedError("dictionary service is not configured", "reason", "GEMINI_API_KEY is empty")
	}

	reqBody, err := buildGeminiRequestBody(word, targetLanguage)
	if err != nil {
		return nil, fmt.Errorf("failed to build Gemini request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/v1beta/models/%s:generateContent", dc.geminiBaseURL, dc.geminiModel)

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	// The API key travels as a header, never a URL query parameter, so it
	// never ends up in a logged request URL (see newGeminiUpstreamError).
	req.Header.Set("x-goog-api-key", dc.geminiAPIKey)

	resp, err := dc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch dictionary data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, newGeminiUpstreamError(endpoint, resp)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Gemini response: %w", err)
	}

	return parseGeminiResponse(respBody, word)
}

// buildGeminiRequestBody builds the JSON request body asking Gemini to look
// up word and translate it into targetLanguage, constrained to
// geminiResponseSchema.
func buildGeminiRequestBody(word, targetLanguage string) ([]byte, error) {
	prompt := fmt.Sprintf(geminiPromptTemplate, targetLanguage, word, targetLanguage, targetLanguage)

	reqBody := geminiRequestBody{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
		GenerationConfig: geminiGenerationConfig{
			ResponseMIMEType: "application/json",
			ResponseSchema:   geminiResponseSchema,
		},
	}

	return json.Marshal(reqBody)
}

// newGeminiUpstreamError builds the error returned when Gemini responds with
// a status other than 200. The request URL, a Retry-After header (set on a
// 429 quota-exceeded response) and a whitespace-collapsed body snippet are
// attached as log-only detail via common.NewDetailedError, so a future
// occurrence can be diagnosed from the log alone. The URL never contains the
// API key, since fetchWordDataFromGemini sends it as a header.
func newGeminiUpstreamError(endpoint string, resp *http.Response) error {
	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, maxDiagnosticBodySnippetBytes))
	bodySnippet := strings.Join(strings.Fields(string(bodyBytes)), " ")

	return common.NewDetailedError(
		fmt.Sprintf("gemini request returned HTTP %d", resp.StatusCode),
		"url", endpoint,
		"retry_after", resp.Header.Get("Retry-After"),
		"body_snippet", bodySnippet,
	)
}

// parseGeminiResponse decodes a Gemini generateContent response and maps its
// structured JSON payload into the response shape returned by the dictionary
// API.
func parseGeminiResponse(body []byte, word string) (*models.CambridgeResponse, error) {
	var envelope geminiGenerateContentResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %w", err)
	}
	if len(envelope.Candidates) == 0 || len(envelope.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini response contained no candidates")
	}

	var payload geminiWordPayload
	if err := json.Unmarshal([]byte(envelope.Candidates[0].Content.Parts[0].Text), &payload); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini dictionary payload: %w", err)
	}

	if !payload.Found {
		return nil, fmt.Errorf("%w: %s", errWordNotFound, word)
	}

	definitions := make([]models.CambridgeDefinition, len(payload.Definitions))
	for i, d := range payload.Definitions {
		examples := make([]models.CambridgeExample, len(d.Examples))
		for j, e := range d.Examples {
			examples[j] = models.CambridgeExample{ID: j, Text: e.Text, Translation: e.Translation}
		}

		definitions[i] = models.CambridgeDefinition{
			ID:          i,
			POS:         d.POS,
			Text:        d.Text,
			Translation: d.Translation,
			Example:     examples,
		}
	}

	return &models.CambridgeResponse{
		Word:          payload.Word,
		POS:           payload.POS,
		Verbs:         []models.CambridgeVerb{},
		Pronunciation: []models.CambridgePronunciation{},
		Definition:    definitions,
	}, nil
}
