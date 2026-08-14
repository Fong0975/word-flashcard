package dictionary

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"

	"word-flashcard/internal/models"

	"github.com/PuerkitoBio/goquery"
)

// helloFixtureHTML is a minimal stand-in for a Cambridge Dictionary word page,
// covering every selector fetchWordDataFromCambridge and its helpers rely on:
// headword, two parts of speech (one duplicated across pos-header blocks to
// exercise dedup), pronunciation audio for each, and two definitions with
// translations and examples.
const helloFixtureHTML = `
<html><body>
<div class="pr entry-body__el">
	<div class="pos-header dpos-h">
		<span class="dpos-g"><span class="pos dpos">exclamation</span></span>
		<span class="dpron-i">
			<span class="region dreg">uk</span>
			<span class="pron dpron">/heˈləʊ/</span>
			<audio><source src="/us/media/english-chinese-traditional/uk_pron/hello-uk.mp3"></audio>
		</span>
		<span class="dpron-i">
			<span class="region dreg">us</span>
			<span class="pron dpron">/heˈloʊ/</span>
			<audio><source src="/us/media/english-chinese-traditional/us_pron/hello-us.mp3"></audio>
		</span>
	</div>
	<span class="hw dhw">hello</span>
	<div class="pr dictionary" data-id="cald4-1">
		<div class="def-block ddef_block">
			<div class="def-body ddef_b">
				<div class="def ddef_d db">used when meeting or greeting someone</div>
				<span class="trans dtrans">喂，你好</span>
				<div class="examp dexamp">
					<span class="eg deg">Hello, Paul.</span>
					<span class="trans dtrans">你好，保羅。</span>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="pr entry-body__el">
	<div class="pos-header dpos-h">
		<span class="dpos-g"><span class="pos dpos">exclamation</span></span>
	</div>
	<span class="pos dpos">noun</span>
	<div class="pr dictionary" data-id="cald4-2">
		<div class="def-block ddef_block">
			<div class="def-body ddef_b">
				<div class="def ddef_d db">something that is said to attract someone's attention</div>
				<span class="trans dtrans">（引起別人注意的招呼語）</span>
			</div>
		</div>
	</div>
</div>
</body></html>
`

// newTestControllerWithCambridgeServer starts an httptest.Server driven by handler
// and returns a Controller pointed at it, plus a cleanup func to close the server.
func newTestControllerWithCambridgeServer(handler http.HandlerFunc) (*Controller, func()) {
	server := httptest.NewServer(handler)
	controller := New()
	controller.cambridgeBaseURL = server.URL
	return controller, server.Close
}

// TestFetchWordDataFromCambridge tests fetchWordDataFromCambridge across language
// validation, HTTP failure modes and successful HTML scraping.
func (suite *ControllerTestSuite) TestFetchWordDataFromCambridge() {
	tests := []struct {
		name                  string
		word                  string
		language              string
		unreachable           bool
		handler               http.HandlerFunc
		wantErrIs             error
		wantErrContains       string
		wantWord              string
		wantPOS               []string
		wantPronunciationLen  int
		wantDefinitionLen     int
	}{
		{
			name:     "returns parsed word data for a supported language and known word",
			word:     "hello",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Equal("/us/dictionary/english-chinese-traditional/hello", r.URL.Path)
				suite.NotEmpty(r.Header.Get("User-Agent"), "request should send a browser-like User-Agent")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(helloFixtureHTML))
			},
			wantWord:             "hello",
			wantPOS:               []string{"exclamation", "noun"},
			wantPronunciationLen: 2,
			wantDefinitionLen:    2,
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
			name:     "returns an error when the word cannot be encoded into a valid request URL",
			word:     "hel\nlo",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				suite.Fail("a request should never be sent once URL construction fails")
			},
			wantErrContains: "failed to create request",
		},
		{
			name:     "returns errWordNotFound when Cambridge responds 404",
			word:     "zzzznotaword",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusNotFound)
			},
			wantErrIs: errWordNotFound,
		},
		{
			name:     "returns errWordNotFound when the page has no headword despite a 200 response",
			word:     "hello",
			language: "en-tw",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(`<html><body><p>no headword here</p></body></html>`))
			},
			wantErrIs: errWordNotFound,
		},
		{
			name:     "returns a generic error when Cambridge responds with a server error",
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
			wantErrContains: "failed to fetch dictionary page",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			var controller *Controller
			if tt.unreachable {
				controller = New()
				controller.cambridgeBaseURL = "http://127.0.0.1:1"
			} else {
				var closeServer func()
				controller, closeServer = newTestControllerWithCambridgeServer(tt.handler)
				defer closeServer()
			}

			response, err := controller.fetchWordDataFromCambridge(tt.word, tt.language)

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

// TestParseCambridgeDocument tests parseCambridgeDocument's headword gate that
// distinguishes a real entry from a page Cambridge Dictionary doesn't have.
func (suite *ControllerTestSuite) TestParseCambridgeDocument() {
	tests := []struct {
		name      string
		html      string
		wantErrIs error
	}{
		{
			name: "returns a response when the headword is present",
			html: helloFixtureHTML,
		},
		{
			name:      "returns errWordNotFound when the headword element is missing",
			html:      `<html><body><p>no headword here</p></body></html>`,
			wantErrIs: errWordNotFound,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			doc, err := goquery.NewDocumentFromReader(strings.NewReader(tt.html))
			suite.Require().NoError(err)

			response, err := parseCambridgeDocument(doc, "https://dictionary.cambridge.org", "hello")

			if tt.wantErrIs != nil {
				suite.Require().Error(err)
				suite.True(errors.Is(err, tt.wantErrIs))
				suite.Nil(response)
				return
			}

			suite.Require().NoError(err)
			suite.Equal("hello", response.Word)
		})
	}
}

// TestExtractPartsOfSpeech tests that extractPartsOfSpeech dedupes and skips blanks.
func (suite *ControllerTestSuite) TestExtractPartsOfSpeech() {
	tests := []struct {
		name string
		html string
		want []string
	}{
		{
			name: "collects unique, non-blank pos labels in document order",
			html: `<div>
				<span class="pos dpos">noun</span>
				<span class="pos dpos">noun</span>
				<span class="pos dpos">   </span>
				<span class="pos dpos">verb</span>
			</div>`,
			want: []string{"noun", "verb"},
		},
		{
			name: "returns no entries when there are no pos nodes",
			html: `<div></div>`,
			want: nil,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			doc, err := goquery.NewDocumentFromReader(strings.NewReader(tt.html))
			suite.Require().NoError(err)

			suite.Equal(tt.want, extractPartsOfSpeech(doc))
		})
	}
}

// TestExtractPronunciation tests that extractPronunciation only emits entries that
// have a pos group, an audio source and pronunciation text.
func (suite *ControllerTestSuite) TestExtractPronunciation() {
	tests := []struct {
		name string
		html string
		want []models.CambridgePronunciation
	}{
		{
			name: "collects an entry with lang, audio url and pron for its pos group",
			html: `<div class="pos-header dpos-h">
				<span class="dpos-g"><span class="pos dpos">verb</span></span>
				<span class="dpron-i">
					<span class="region dreg">uk</span>
					<span class="pron dpron">/test/</span>
					<audio><source src="/media/test-uk.mp3"></audio>
				</span>
			</div>`,
			want: []models.CambridgePronunciation{
				{POS: "verb", Lang: "uk", URL: "https://example.com/media/test-uk.mp3", Pron: "/test/"},
			},
		},
		{
			name: "skips a pos-header block without a dpos-g node",
			html: `<div class="pos-header dpos-h">
				<span class="dpron-i">
					<span class="region dreg">uk</span>
					<span class="pron dpron">/test/</span>
					<audio><source src="/media/test-uk.mp3"></audio>
				</span>
			</div>`,
			want: nil,
		},
		{
			name: "skips a pronunciation entry missing the audio source",
			html: `<div class="pos-header dpos-h">
				<span class="dpos-g"><span class="pos dpos">verb</span></span>
				<span class="dpron-i">
					<span class="region dreg">uk</span>
					<span class="pron dpron">/test/</span>
				</span>
			</div>`,
			want: nil,
		},
		{
			name: "skips a pronunciation entry missing the pron text",
			html: `<div class="pos-header dpos-h">
				<span class="dpos-g"><span class="pos dpos">verb</span></span>
				<span class="dpron-i">
					<span class="region dreg">uk</span>
					<audio><source src="/media/test-uk.mp3"></audio>
				</span>
			</div>`,
			want: nil,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			doc, err := goquery.NewDocumentFromReader(strings.NewReader(tt.html))
			suite.Require().NoError(err)

			suite.Equal(tt.want, extractPronunciation(doc, "https://example.com"))
		})
	}
}

// TestExtractDefinitions tests that extractDefinitions gathers pos, text,
// translation and examples for each definition block.
func (suite *ControllerTestSuite) TestExtractDefinitions() {
	tests := []struct {
		name string
		html string
		want []models.CambridgeDefinition
	}{
		{
			name: "collects definition text, translation, pos and examples",
			html: `<div class="pr entry-body__el">
				<span class="pos dpos">verb</span>
				<div class="def-block ddef_block">
					<div class="def-body ddef_b">
						<div class="def ddef_d db">to do something</div>
						<span class="trans dtrans">做某事</span>
						<div class="examp dexamp">
							<span class="eg deg">He did it.</span>
							<span class="trans dtrans">他做了。</span>
						</div>
					</div>
				</div>
			</div>`,
			want: []models.CambridgeDefinition{
				{
					ID:          0,
					POS:         "verb",
					Text:        "to do something",
					Translation: "做某事",
					Example: []models.CambridgeExample{
						{ID: 0, Text: "He did it.", Translation: "他做了。"},
					},
				},
			},
		},
		{
			name: "returns an empty pos when there is no enclosing entry-body element",
			html: `<div class="def-block ddef_block">
				<div class="def-body ddef_b">
					<div class="def ddef_d db">to do something</div>
				</div>
			</div>`,
			want: []models.CambridgeDefinition{
				{ID: 0, POS: "", Text: "to do something", Translation: "", Example: nil},
			},
		},
		{
			name: "returns no examples when the definition has none",
			html: `<div class="pr entry-body__el">
				<span class="pos dpos">verb</span>
				<div class="def-block ddef_block">
					<div class="def-body ddef_b">
						<div class="def ddef_d db">to do something</div>
						<span class="trans dtrans">做某事</span>
					</div>
				</div>
			</div>`,
			want: []models.CambridgeDefinition{
				{ID: 0, POS: "verb", Text: "to do something", Translation: "做某事", Example: nil},
			},
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			doc, err := goquery.NewDocumentFromReader(strings.NewReader(tt.html))
			suite.Require().NoError(err)

			suite.Equal(tt.want, extractDefinitions(doc))
		})
	}
}
