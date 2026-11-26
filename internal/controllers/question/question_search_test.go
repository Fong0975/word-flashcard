package question

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestSearchQuestions tests the SearchQuestions handler
func (suite *ControllerTestSuite) TestSearchQuestions() {
	const keywordBody = `{"conditions":[{"key":"question","operator":"like","value":"%report%"}],"logic":"OR"}`
	keywordWhere := squirrel.Like{"question": "%report%"}
	defaultOrderBy := []string{"created_at DESC", "id DESC"}

	testCases := []struct {
		name           string
		query          string
		requestBody    string
		expectSelect   bool
		expectedWhere  squirrel.Sqlizer
		expectedLimit  uint64
		expectedOffset uint64
		selectResult   []*dbModels.Question
		selectError    error
		expectedStatus int
		expectedResult []*models.Question
	}{
		{
			name:           "empty filter returns all questions",
			requestBody:    `{}`,
			expectSelect:   true,
			expectedLimit:  100,
			selectResult:   getSampleQuestions(),
			expectedStatus: http.StatusOK,
			expectedResult: getExpectedQuestions(),
		},
		{
			name:           "keyword filter with pagination",
			query:          "?limit=20&offset=40",
			requestBody:    keywordBody,
			expectSelect:   true,
			expectedWhere:  keywordWhere,
			expectedLimit:  20,
			expectedOffset: 40,
			selectResult:   getSampleQuestions()[1:2],
			expectedStatus: http.StatusOK,
			expectedResult: getExpectedQuestions()[1:2],
		},
		{
			name:           "no match returns an empty array",
			requestBody:    keywordBody,
			expectSelect:   true,
			expectedWhere:  keywordWhere,
			expectedLimit:  100,
			expectedStatus: http.StatusOK,
			expectedResult: []*models.Question{},
		},
		{
			name:           "disallowed key",
			requestBody:    `{"conditions":[{"key":"answer","operator":"eq","value":"A"}],"logic":"OR"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid limit",
			query:          "?limit=abc",
			requestBody:    keywordBody,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid sort column",
			query:          "?sort=unknown",
			requestBody:    keywordBody,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "database error",
			requestBody:    keywordBody,
			expectSelect:   true,
			expectedWhere:  keywordWhere,
			expectedLimit:  100,
			selectError:    errors.New("select failed"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Without an expectation, any call to Select fails the test.
			if tc.expectSelect {
				orderByMatcher := make([]*string, 0, len(defaultOrderBy))
				for i := range defaultOrderBy {
					orderByMatcher = append(orderByMatcher, &defaultOrderBy[i])
				}
				suite.mockQuestionPeer.EXPECT().
					Select([]*string{}, tc.expectedWhere, orderByMatcher, &tc.expectedLimit, &tc.expectedOffset).
					Return(tc.selectResult, tc.selectError).Once()
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/search"+tc.query, io.NopCloser(bytes.NewReader([]byte(tc.requestBody))))
			suite.controller.SearchQuestions(ctx)

			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			if tc.expectedStatus == http.StatusOK {
				expectedJSON, err := json.Marshal(tc.expectedResult)
				assert.NoError(suite.T(), err)
				assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
			}
		})
	}
}

// TestParseQuestionSearchFilter tests the parseQuestionSearchFilter function
func (suite *HelperTestSuite) TestParseQuestionSearchFilter() {
	testCases := []struct {
		name          string
		requestBody   string
		expectedWhere squirrel.Sqlizer
		expectedOK    bool
	}{
		{
			name:       "empty body",
			expectedOK: true,
		},
		{
			name:        "empty object",
			requestBody: `{}`,
			expectedOK:  true,
		},
		{
			name:        "all searchable columns",
			requestBody: `{"conditions":[{"key":"question","operator":"like","value":"%a%"},{"key":"option_a","operator":"like","value":"%a%"},{"key":"option_b","operator":"like","value":"%a%"},{"key":"option_c","operator":"like","value":"%a%"},{"key":"option_d","operator":"like","value":"%a%"}],"logic":"OR"}`,
			expectedWhere: squirrel.Or{
				squirrel.Like{"question": "%a%"},
				squirrel.Like{"option_a": "%a%"},
				squirrel.Like{"option_b": "%a%"},
				squirrel.Like{"option_c": "%a%"},
				squirrel.Like{"option_d": "%a%"},
			},
			expectedOK: true,
		},
		{
			name:        "reminder presence filter",
			requestBody: `{"conditions":[{"key":"reminder","operator":"is_not_null"},{"key":"reminder","operator":"is_not_empty"}],"logic":"AND"}`,
			expectedWhere: squirrel.And{
				squirrel.NotEq{"reminder": nil},
				squirrel.NotEq{"reminder": ""},
			},
			expectedOK: true,
		},
		{
			name:        "existing column that is not searchable",
			requestBody: `{"conditions":[{"key":"notes","operator":"like","value":"%a%"}],"logic":"OR"}`,
		},
		{
			name:        "SQL expression as key",
			requestBody: `{"conditions":[{"key":"1=1 OR question","operator":"eq","value":"a"}],"logic":"OR"}`,
		},
		{
			name:        "invalid logic",
			requestBody: `{"conditions":[{"key":"question","operator":"like","value":"%a%"}],"logic":"XOR"}`,
		},
		{
			name:        "unsupported operator",
			requestBody: `{"conditions":[{"key":"question","operator":"regex","value":"a"}],"logic":"OR"}`,
		},
		{
			name:        "missing conditions",
			requestBody: `{"logic":"OR"}`,
		},
		{
			name:        "invalid JSON",
			requestBody: `{`,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/questions/search", io.NopCloser(bytes.NewReader([]byte(tc.requestBody))))

			where, ok := parseQuestionSearchFilter(ctx)

			assert.Equal(suite.T(), tc.expectedOK, ok)
			assert.Equal(suite.T(), tc.expectedWhere, where)
			if !tc.expectedOK {
				assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
			}
		})
	}
}
