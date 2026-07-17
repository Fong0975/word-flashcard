package note

import (
	"net/http"
	"net/http/httptest"

	"word-flashcard/data/schema"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestDeleteNote tests the DeleteNote handler
func (suite *ControllerTestSuite) TestDeleteNote() {
	testID := 1
	where := squirrel.Eq{schema.NOTE_ID: testID}

	suite.mockNotePeer.EXPECT().
		Delete(where).
		Return(int64(testID), nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/notes/1", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}
	suite.controller.DeleteNote(ctx)

	assert.Equal(suite.T(), http.StatusNoContent, w.Code)
	assert.Equal(suite.T(), "", w.Body.String())
}
