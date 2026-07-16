package note

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestListNotes tests the ListNotes handler
func (suite *ControllerTestSuite) TestListNotes() {
	limitPtr := uint64(100)
	offsetPtr := uint64(0)
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, &limitPtr, &offsetPtr).
		Return(getSampleNotes(), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes", nil)
	suite.controller.ListNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes())
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
