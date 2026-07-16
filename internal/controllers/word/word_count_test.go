package word

import (
	"bytes"
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

// TestCountWords tests the CountWords handler
func (suite *ControllerTestSuite) TestCountWords() {
	// Mock wordPeer methods as needed
	whereWord := squirrel.Eq{schema.WORD_FAMILIARITY: "yellow"}
	sampleWords := getSampleWords()
	suite.mockWordPeer.EXPECT().
		Select(mock.Anything, whereWord, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{sampleWords[1], sampleWords[3], sampleWords[4]}, nil).Times(1)
	whereDefinition := squirrel.Like{schema.WORD_DEFINITIONS_DEFINITION: "%yellow%"}
	sampleDefinition := getSampleWordDefinitions()
	suite.mockWordDefinitionPeer.EXPECT().
		Select(mock.Anything, whereDefinition, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{sampleDefinition[0], sampleDefinition[1], sampleDefinition[3]}, nil).Times(1)

	// Create a test HTTP request and call the handler
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	requestFilter := "{\"conditions\": [{ \"key\": \"familiarity\", \"operator\": \"eq\", \"value\": \"yellow\" }, { \"key\": \"definition\", \"operator\": \"like\", \"value\": \"%yellow%\" }], \"logic\": \"AND\"}"
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/words/count", io.NopCloser(bytes.NewReader([]byte(requestFilter))))
	suite.controller.CountWords(ctx)

	// Verify the response status code
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Verify the response body
	expectedResponse := "{\"count\":2}"
	assert.Equal(suite.T(), expectedResponse, w.Body.String())
}
