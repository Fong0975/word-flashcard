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
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleNotes()[:1], nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestBody := `{"conditions":[{"key":"title","operator":"like","value":"%Grammar%"}],"logic":"AND"}`
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/notes/search", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	suite.controller.SearchNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes()[:1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
