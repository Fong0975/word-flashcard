package models

// DictionaryResponse represents the API response structure for dictionary lookups
type DictionaryResponse struct {
	Phonetics []PhoneticInfo `json:"phonetics"`
	Meanings  []MeaningInfo  `json:"meanings"`
}

// PhoneticInfo contains pronunciation data
type PhoneticInfo struct {
	Language string `json:"language,omitempty"`
	Audio    string `json:"audio,omitempty"`
}

// MeaningInfo contains word meaning and definitions
type MeaningInfo struct {
	PartOfSpeech string           `json:"partOfSpeech"`
	Definitions  []DefinitionInfo `json:"definitions"`
}

// DefinitionInfo contains definition details and examples
type DefinitionInfo struct {
	Definition string   `json:"definition"`
	Example    []string `json:"example,omitempty"`
}

// Cambridge Dictionary API response structures (for parsing external API)
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
