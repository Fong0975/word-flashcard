package note

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	dbModels "word-flashcard/data/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestGetNote tests the GetNote handler
func (suite *ControllerTestSuite) TestGetNote() {
	suite.mockNotePeer.EXPECT().
		Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{getSampleNotes()[1]}, nil).Times(1)

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/notes/2", nil)
	ctx.Params = gin.Params{gin.Param{Key: "id", Value: "2"}}
	suite.controller.GetNote(ctx)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	expectedJSON, err := json.Marshal(getExpectedNotes()[1])
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), string(expectedJSON), w.Body.String())
}
