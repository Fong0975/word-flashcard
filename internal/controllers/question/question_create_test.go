package question

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestCreateQuestions tests the CreateQuestions handler
func (suite *ControllerTestSuite) TestCreateQuestions() {
	testID := 1
	where := squirrel.Eq{schema.QUESTION_ID: int64(testID)}

	// Mock mockQuestionPeer methods as needed
	suite.mockQuestionPeer.EXPECT().
		Insert(mock.MatchedBy(func(question *dbModels.Question) bool {
			return question != nil && question.Question != nil && question.OptionA != nil && question.Answer != nil
		})).
		Return(int64(testID), nil).Times(1)
	suite.mockQuestionPeer.EXPECT().
		Select(mock.Anything, where, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{getSampleQuestions()[0]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := "{\"question\": \"The marketing department has decided to ______ the new product launch until next month.\",\"option_a\": \"postpone\",\"option_b\": \"postpone\",\"option_c\": \"postponing\",\"option_d\": \"postponement\",\"answer\": \"A\",\"reference\": \"Google Gemini Sample Q01\",\"notes\": \"- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。\",\"countPractise\": 10,\"countFailurePractise\": 2}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.CreateQuestions(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expected := getExpectedQuestions()[0]
	expectedQuestionJSON, err := json.Marshal(expected)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedQuestionJSON), w.Body.String())
}
