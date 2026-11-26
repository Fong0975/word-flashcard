package question

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestCountQuestions tests the CountQuestions handler
func (suite *ControllerTestSuite) TestCountQuestions() {
	testCases := []struct {
		name           string
		requestBody    string
		expectCount    bool
		expectedWhere  squirrel.Sqlizer
		countError     error
		expectedStatus int
	}{
		{
			name:           "empty body counts all questions",
			expectCount:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "keyword filter",
			requestBody:    `{"conditions":[{"key":"option_a","operator":"like","value":"%post%"}],"logic":"OR"}`,
			expectCount:    true,
			expectedWhere:  squirrel.Like{"option_a": "%post%"},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "disallowed key",
			requestBody:    `{"conditions":[{"key":"reference","operator":"like","value":"%a%"}],"logic":"OR"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "database error",
			expectCount:    true,
			countError:     errors.New("count failed"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Without an expectation, any call to Count fails the test.
			if tc.expectCount {
				suite.mockQuestionPeer.EXPECT().
					Count(tc.expectedWhere).
					Return(int64(5), tc.countError).Once()
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/count", io.NopCloser(bytes.NewReader([]byte(tc.requestBody))))
			suite.controller.CountQuestions(ctx)

			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			if tc.expectedStatus == http.StatusOK {
				assert.Equal(suite.T(), `{"count":5}`, w.Body.String())
			}
		})
	}
}
