package dictionary

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
