package question

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestRandomQuestions tests the RandomQuestions handler
func (suite *ControllerTestSuite) TestRandomQuestions() {
	// count=2 bucket quota breakdown (5:3:2 ratio, integer division):
	//   quota1 = 2*5/10 = 1 (unpractised)
	//   quota2 = 2*3/10 = 0 (high-failure-rate) → skipped by fetchQuestionBucket
	//   quota3 = 2-1-0  = 1 (high-success-rate)
	randomOrderMatcher := mock.MatchedBy(func(orderBy []*string) bool {
		return len(orderBy) == 1 && orderBy[0] != nil && *orderBy[0] == database.TERM_MAPPING_FUNC_RANDOM
	})
	limit1 := uint64(1)
	limit3 := uint64(1)

	// Bucket 1: unpractised (count_practise = 0)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, squirrel.Eq{schema.QUESTION_COUNT_PRACTISE: 0}, randomOrderMatcher, &limit1, (*uint64)(nil)).
		Return([]*dbModels.Question{getSampleQuestions()[1]}, nil).Times(1)

	// Bucket 2: quota=0, fetchQuestionBucket returns early — no Select call expected

	// Bucket 3: high success rate (catch-all where, limit=1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, mock.Anything, randomOrderMatcher, &limit3, (*uint64)(nil)).
		Return([]*dbModels.Question{getSampleQuestions()[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"count\": 2}}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/random", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.RandomQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body contains the expected questions (order may vary due to shuffle)
	var actualQuestions []*models.Question
	err := json.Unmarshal(w.Body.Bytes(), &actualQuestions)
	assert.NoError(suite.T(), err)
	assert.ElementsMatch(suite.T(), []*models.Question{getExpectedQuestions()[1], getExpectedQuestions()[3]}, actualQuestions)
}
