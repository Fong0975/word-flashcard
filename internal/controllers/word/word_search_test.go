package word

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestSearchWords tests the SearchWords handler
func (suite *ControllerTestSuite) TestSearchWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	sampleWords := getSampleWords()
	sampleDefinition := getSampleWordDefinitions()

	// 1. First call: getWordIDsFromWords - wordPeer.Select (no pagination)
	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"}
	suite.mockWordPeer.EXPECT().
		Select(([]*string)(nil), whereWord, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.Word{sampleWords[1], sampleWords[3], sampleWords[4]}, nil).Times(1)

	// 2. Second call: getWordIDsFromWordDefinitions - wordDefinitionPeer.Select (no pagination)
	whereDefinition := squirrel.Like{schema.WORD_DEFINITIONS_DEFINITION: "%yellow%"}
	suite.mockWordDefinitionPeer.EXPECT().
		Select(([]*string)(nil), whereDefinition, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{sampleDefinition[0], sampleDefinition[1], sampleDefinition[3]}, nil).Times(1)

	// 3. Third call: queryWordsByIDs - wordPeer.Select (with pagination)
	whereWordIDs := squirrel.Eq{schema.WORD_ID: []int{2, 4}}
	suite.mockWordPeer.EXPECT().
		Select([]*string{}, whereWordIDs, mock.Anything, &limitPtr, &offsetPtr).
		Return([]*dbModels.Word{sampleWords[1], sampleWords[3]}, nil).Times(1)

	// 4. Fourth call: getWordDefinitionsByWords - wordDefinitionPeer.Select (no pagination)
	whereDefinitionsByWordIDs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{2, 4}}
	suite.mockWordDefinitionPeer.EXPECT().
		Select([]*string{}, whereDefinitionsByWordIDs, mock.Anything, (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{sampleDefinition[1], sampleDefinition[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"yellow\" }, { \"key\": \"definition\", \"operator\": \"like\", \"value\": \"%yellow%\" }], \"logic\": \"AND\"}"
	ctx.Params = gin.Params{gin.Param{Key: "limit", Value: "100"}, gin.Param{Key: "offset", Value: "0"}}
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedWords := getExpectedWords()
	expectedWord, err := json.Marshal([]*models.Word{expectedWords[1], expectedWords[3]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestSearchWordsInvalidRequestBody tests that a malformed JSON body returns 400
func (suite *ControllerTestSuite) TestSearchWordsInvalidRequestBody() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": ["
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestSearchWordsInvalidLimit tests that a malformed limit query parameter returns 400
func (suite *ControllerTestSuite) TestSearchWordsInvalidLimit() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search?limit=abc", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestSearchWordsInvalidSortParam tests that a malformed sort query parameter returns 400
func (suite *ControllerTestSuite) TestSearchWordsInvalidSortParam() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search?sort=-", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestSearchWordsInvalidSortColumn tests that a disallowed sort column returns 400
func (suite *ControllerTestSuite) TestSearchWordsInvalidSortColumn() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search?sort=bogus_column", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestSearchWordsEmptyFilterCustomSort tests that an empty filter with a valid
// custom sort parameter fetches all records ordered by the requested column.
func (suite *ControllerTestSuite) TestSearchWordsEmptyFilterCustomSort() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	sampleWords := getSampleWords()
	sampleDefinition := getSampleWordDefinitions()

	suite.mockWordPeer.EXPECT().
		Select([]*string{}, (squirrel.Sqlizer)(nil), mock.Anything, &limitPtr, &offsetPtr).
		Return([]*dbModels.Word{sampleWords[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select([]*string{}, mock.Anything, mock.Anything, (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{sampleDefinition[0]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search?sort=word", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedWords := getExpectedWords()
	expectedWord, err := json.Marshal([]*models.Word{expectedWords[0]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWord), w.Body.String())
}

// TestSearchWordsEmptyFilterNoResults tests that an empty filter with no
// matching records responds with an empty array, not null.
func (suite *ControllerTestSuite) TestSearchWordsEmptyFilterNoResults() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)

	suite.mockWordPeer.EXPECT().
		Select([]*string{}, (squirrel.Sqlizer)(nil), mock.Anything, &limitPtr, &offsetPtr).
		Return([]*dbModels.Word{}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select([]*string{}, mock.Anything, mock.Anything, (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), "[]", w.Body.String())
}

// TestSearchWordsEmptyFilterPeerError tests that a database failure while
// fetching all records (empty filter) returns 500.
func (suite *ControllerTestSuite) TestSearchWordsEmptyFilterPeerError() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)

	suite.mockWordPeer.EXPECT().
		Select([]*string{}, (squirrel.Sqlizer)(nil), mock.Anything, &limitPtr, &offsetPtr).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte("{}"))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestSearchWordsInvalidFilterColumn tests that a filter referencing an
// unknown column returns 400.
func (suite *ControllerTestSuite) TestSearchWordsInvalidFilterColumn() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"bogus_column\", \"operator\": \"eq\", \"value\": \"x\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestSearchWordsWordsTableQueryError tests that a database failure while
// querying the words table returns 500.
func (suite *ControllerTestSuite) TestSearchWordsWordsTableQueryError() {
	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"}
	suite.mockWordPeer.EXPECT().
		Select(([]*string)(nil), whereWord, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"yellow\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestSearchWordsWordDefinitionsTableQueryError tests that a database failure
// while querying the word_definitions table returns 500.
func (suite *ControllerTestSuite) TestSearchWordsWordDefinitionsTableQueryError() {
	whereDefinition := squirrel.Like{schema.WORD_DEFINITIONS_DEFINITION: "%yellow%"}
	suite.mockWordDefinitionPeer.EXPECT().
		Select(([]*string)(nil), whereDefinition, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"definition\", \"operator\": \"like\", \"value\": \"%yellow%\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestSearchWordsFinalPaginationQueryError tests that a database failure while
// fetching the final, paginated set of matched words returns 500.
func (suite *ControllerTestSuite) TestSearchWordsFinalPaginationQueryError() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	sampleWords := getSampleWords()
	sampleDefinition := getSampleWordDefinitions()

	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"}
	suite.mockWordPeer.EXPECT().
		Select(([]*string)(nil), whereWord, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.Word{sampleWords[1], sampleWords[3], sampleWords[4]}, nil).Times(1)

	whereDefinition := squirrel.Like{schema.WORD_DEFINITIONS_DEFINITION: "%yellow%"}
	suite.mockWordDefinitionPeer.EXPECT().
		Select(([]*string)(nil), whereDefinition, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{sampleDefinition[0], sampleDefinition[1], sampleDefinition[3]}, nil).Times(1)

	whereWordIDs := squirrel.Eq{schema.WORD_ID: []int{2, 4}}
	suite.mockWordPeer.EXPECT().
		Select([]*string{}, whereWordIDs, mock.Anything, &limitPtr, &offsetPtr).
		Return(nil, fmt.Errorf("select failed")).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"yellow\" }, { \"key\": \"definition\", \"operator\": \"like\", \"value\": \"%yellow%\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// TestSearchWordsFinalResultEmpty tests that a filter whose per-table results
// don't intersect responds with an empty array, without a final pagination query.
func (suite *ControllerTestSuite) TestSearchWordsFinalResultEmpty() {
	sampleWords := getSampleWords()
	sampleDefinition := getSampleWordDefinitions()

	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "red"}
	suite.mockWordPeer.EXPECT().
		Select(([]*string)(nil), whereWord, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.Word{sampleWords[0]}, nil).Times(1)

	whereDefinition := squirrel.Like{schema.WORD_DEFINITIONS_DEFINITION: "%corn%"}
	suite.mockWordDefinitionPeer.EXPECT().
		Select(([]*string)(nil), whereDefinition, ([]*string)(nil), (*uint64)(nil), (*uint64)(nil)).
		Return([]*dbModels.WordDefinition{sampleDefinition[4]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"red\" }, { \"key\": \"definition\", \"operator\": \"like\", \"value\": \"%corn%\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/search", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.SearchWords(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), "[]", w.Body.String())
}
