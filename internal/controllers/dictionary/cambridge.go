package dictionary

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"word-flashcard/internal/models"

	"github.com/PuerkitoBio/goquery"
)

// errWordNotFound marks a lookup for a word the Cambridge Dictionary site does not
// have, as opposed to the site being unreachable or the request failing outright.
var errWordNotFound = errors.New("word not found")

// errUnsupportedLanguage marks a language slug this controller does not know how to fetch.
var errUnsupportedLanguage = errors.New("unsupported language")

// cambridgeUserAgent mimics a common desktop browser so Cambridge Dictionary serves
// the full page instead of blocking the request as a non-browser client.
const cambridgeUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// languageConfig maps a slug language (e.g. "en-tw") to the nation and dictionary
// path segment used to build the Cambridge Dictionary URL.
type languageConfig struct {
	nation   string
	language string
}

// supportedLanguages lists the slug languages this controller knows how to fetch.
// Only en-tw is implemented for now, but the map keeps the route contract ready
// for the rest (en, uk, en-cn) to be added later without a breaking change.
var supportedLanguages = map[string]languageConfig{
	"en-tw": {nation: "us", language: "english-chinese-traditional"},
}

// fetchWordDataFromCambridge scrapes the Cambridge Dictionary page for word and
// parses it into the response shape returned by the dictionary API.
func (dc *Controller) fetchWordDataFromCambridge(word, slugLanguage string) (*models.CambridgeResponse, error) {
	word = strings.TrimSpace(word)
	if word == "" {
		return nil, fmt.Errorf("word cannot be empty")
	}

	cfg, ok := supportedLanguages[slugLanguage]
	if !ok {
		return nil, fmt.Errorf("%w: %s", errUnsupportedLanguage, slugLanguage)
	}

	pageURL := fmt.Sprintf("%s/%s/dictionary/%s/%s", dc.cambridgeBaseURL, cfg.nation, cfg.language, word)

	req, err := http.NewRequest(http.MethodGet, pageURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", cambridgeUserAgent)

	resp, err := dc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch dictionary page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("%w: %s", errWordNotFound, word)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("dictionary page returned HTTP %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse dictionary page: %w", err)
	}

	return parseCambridgeDocument(doc, dc.cambridgeBaseURL, word)
}

// parseCambridgeDocument extracts word data from a parsed Cambridge Dictionary page,
// mirroring the cheerio selectors used by the original dictionary scraping logic.
func parseCambridgeDocument(doc *goquery.Document, siteURL, word string) (*models.CambridgeResponse, error) {
	headword := strings.TrimSpace(doc.Find(".hw.dhw").First().Text())
	if headword == "" {
		return nil, fmt.Errorf("%w: %s", errWordNotFound, word)
	}

	return &models.CambridgeResponse{
		Word:          headword,
		POS:           extractPartsOfSpeech(doc),
		Verbs:         []models.CambridgeVerb{},
		Pronunciation: extractPronunciation(doc, siteURL),
		Definition:    extractDefinitions(doc),
	}, nil
}

// extractPartsOfSpeech collects the unique set of part-of-speech labels for the word.
func extractPartsOfSpeech(doc *goquery.Document) []string {
	seen := make(map[string]bool)
	var pos []string

	doc.Find(".pos.dpos").Each(func(_ int, s *goquery.Selection) {
		text := strings.TrimSpace(s.Text())
		if text == "" || seen[text] {
			return
		}
		seen[text] = true
		pos = append(pos, text)
	})

	return pos
}

// extractPronunciation collects pronunciation audio entries grouped by part of speech.
func extractPronunciation(doc *goquery.Document, siteURL string) []models.CambridgePronunciation {
	var pronunciation []models.CambridgePronunciation

	doc.Find(".pos-header.dpos-h").Each(func(_ int, header *goquery.Selection) {
		posNode := header.Find(".dpos-g").First()
		if posNode.Length() == 0 {
			return
		}
		pos := strings.TrimSpace(posNode.Text())

		header.Find(".dpron-i").Each(func(_ int, node *goquery.Selection) {
			lang := strings.TrimSpace(node.Find(".region.dreg").Text())
			audioSrc, hasAudio := node.Find("audio source").Attr("src")
			pron := strings.TrimSpace(node.Find(".pron.dpron").Text())

			if !hasAudio || audioSrc == "" || pron == "" {
				return
			}

			pronunciation = append(pronunciation, models.CambridgePronunciation{
				POS:  pos,
				Lang: lang,
				URL:  siteURL + audioSrc,
				Pron: pron,
			})
		})
	})

	return pronunciation
}

// extractDefinitions collects definitions, translations and examples for the word.
func extractDefinitions(doc *goquery.Document) []models.CambridgeDefinition {
	var definitions []models.CambridgeDefinition

	doc.Find(".def-block.ddef_block").Each(func(index int, block *goquery.Selection) {
		pos := strings.TrimSpace(block.Closest(".pr.entry-body__el").Find(".pos.dpos").First().Text())
		text := strings.TrimSpace(block.Find(".def.ddef_d.db").Text())
		translation := strings.TrimSpace(block.Find(".def-body.ddef_b > span.trans.dtrans").Text())

		var examples []models.CambridgeExample
		block.Find(".def-body.ddef_b > .examp.dexamp").Each(func(exIndex int, ex *goquery.Selection) {
			examples = append(examples, models.CambridgeExample{
				ID:          exIndex,
				Text:        strings.TrimSpace(ex.Find(".eg.deg").Text()),
				Translation: strings.TrimSpace(ex.Find(".trans.dtrans").Text()),
			})
		})

		definitions = append(definitions, models.CambridgeDefinition{
			ID:          index,
			POS:         pos,
			Text:        text,
			Translation: translation,
			Example:     examples,
		})
	})

	return definitions
}
