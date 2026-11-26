package note

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestSearchNotes tests the SearchNotes handler
func (suite *ControllerTestSuite) TestSearchNotes() {
	testCases := []struct {
		name           string
		requestBody    string
		expectSelect   bool
		expectedStatus int
	}{
		{
			name:           "allowed key",
			requestBody:    `{"conditions":[{"key":"title","operator":"like","value":"%Grammar%"}],"logic":"AND"}`,
			expectSelect:   true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "existing column that is not searchable",
			requestBody:    `{"conditions":[{"key":"sort_order","operator":"eq","value":"1"}],"logic":"AND"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "SQL expression as key",
			requestBody:    `{"conditions":[{"key":"title","operator":"like","value":"%a%"},{"key":"1=1 OR title","operator":"eq","value":"a"}],"logic":"OR"}`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Without an expectation, any call to Select fails the test.
			if tc.expectSelect {
				limitPtr := uint64(100)
				offsetPtr := uint64(0)
				suite.mockNotePeer.EXPECT().
					Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
					Return(getSampleNotes()[:1], nil).Times(1)
			}

			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes/search", io.NopCloser(bytes.NewReader([]byte(tc.requestBody))))
			suite.controller.SearchNotes(ctx)

			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			if tc.expectedStatus == http.StatusOK {
				expectedJSON, err := json.Marshal(getExpectedNotes()[:1])
				assert.NoError(suite.T(), err)
				assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
			}
		})
	}
}
