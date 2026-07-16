package note

import (
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestCountNotes tests the CountNotes handler
func (suite *ControllerTestSuite) TestCountNotes() {
	suite.mockNotePeer.EXPECT().
		Count().
		Return(int64(3), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/count", nil)
	suite.controller.CountNotes(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), `{"count":3}`, w.Body.String())
}
