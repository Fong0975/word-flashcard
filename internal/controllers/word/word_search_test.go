package word

import (
	"bytes"
	"encoding/json"
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
