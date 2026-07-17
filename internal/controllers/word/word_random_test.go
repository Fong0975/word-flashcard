package word

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestRandomWords tests the RandomWords handler with familiarity_levels, which
// computes a single-level quota (the whole count, since only one level is
// requested) and fetches it via the never-practiced-first weighted bucket.
func (suite *ControllerTestSuite) TestRandomWords() {
	// Mock wordPeer & wordDefinitionPeer methods as needed
	whereWord := squirrel.And{
		squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"},
		squirrel.Or{
			squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
			squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
		},
	}

	limitPtr := uint64(2)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.MatchedBy(func(orderBy []*string) bool {
			b := len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
			return b
		}), &limitPtr, (*uint64)(nil)).
		Return([]*dbModels.Word{getSampleWords()[1], getSampleWords()[3]}, nil).Times(1)

	// fetchRandomWordsWeighted shuffles its result, so the word IDs used to
	// query definitions may arrive in either order; match on the set, not order.
	wordIDSetMatcher := mock.MatchedBy(func(where squirrel.Eq) bool {
		ids, ok := where[schema.WORD_DEFINITIONS_WORD_ID].([]int)
		if !ok {
			return false
		}
		sorted := append([]int{}, ids...)
		sort.Ints(sorted)
		return len(sorted) == 2 && sorted[0] == 2 && sorted[1] == 4
	})
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, wordIDSetMatcher, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[1], getSampleWordDefinitions()[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"count\": 2, \"familiarity_levels\": [\"yellow\"]}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/random", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.RandomWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body contains the expected words, regardless of shuffle order
	var actualWords []*models.Word
	err := json.Unmarshal(w.Body.Bytes(), &actualWords)
	assert.NoError(suite.T(), err)
	expectedWords := []*models.Word{getExpectedWords()[1], getExpectedWords()[3]}
	assert.ElementsMatch(suite.T(), expectedWords, actualWords)
}

// TestRandomWordsWithPerCategoryCounts tests the RandomWords handler when the
// caller supplies exact per-level quotas directly instead of familiarity_levels.
func (suite *ControllerTestSuite) TestRandomWordsWithPerCategoryCounts() {
	whereWord := squirrel.And{
		squirrel.Eq{schema.WORD_FAMILIARITY: "green"},
		squirrel.Or{
			squirrel.Eq{schema.WORD_COUNT_PRACTISE: 0},
			squirrel.Eq{schema.WORD_LAST_PRACTISED_AT: nil},
		},
	}
	whereDefinitionID := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: []int{1}}

	limitPtr := uint64(1)
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.MatchedBy(func(orderBy []*string) bool {
			b := len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
			return b
		}), &limitPtr, (*uint64)(nil)).
		Return([]*dbModels.Word{getSampleWords()[0]}, nil).Times(1)
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinitionID, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{getSampleWordDefinitions()[0]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"count\": 1, \"per_category_counts\": {\"green\": 1}}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/random", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.RandomWords(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedWords, err := json.Marshal([]*models.Word{getExpectedWords()[0]})
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedWords), w.Body.String())
}

// TestRandomWordsMissingLevelsOrCounts tests that RandomWords rejects a
// request that supplies neither familiarity_levels nor per_category_counts.
func (suite *ControllerTestSuite) TestRandomWordsMissingLevelsOrCounts() {
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"count\": 2}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/random", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.RandomWords(ctx)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}
