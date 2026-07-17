package word

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestStatsWords tests the StatsWords handler
func (suite *ControllerTestSuite) TestStatsWords() {
	// Mock one Count call per familiarity level
	suite.mockWordPeer.EXPECT().
		Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_RED}).
		Return(int64(1), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW}).
		Return(int64(3), nil).Times(1)
	suite.mockWordPeer.EXPECT().
		Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_GREEN}).
		Return(int64(1), nil).Times(1)
	// Mock the Select call that fetches practice counts for all words.
	// getSampleWords() has no CountPractise set (nil → treated as 0), so all 5 words
	// land in the "0" bucket.
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(getSampleWords(), nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/words/stats", nil)
	suite.controller.StatsWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := models.WordStats{
		FamiliarityDistribution: models.WordFamiliarityDistribution{
			Red:    1,
			Yellow: 3,
			Green:  1,
		},
		PracticeCountDistribution: []models.PracticeCountBucket{
			{Range: "0", Count: 5},
		},
	}
	expectedJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
