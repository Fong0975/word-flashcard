package models

// Cambridge Dictionary response structures, assembled directly by the Go scraper
// in internal/controllers/dictionary and returned as-is to API clients.
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
