package word

import (
	"bytes"
	"errors"
	"io"
	"net/http/httptest"
	"testing"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// HelperTestSuite is a test suite for Word helper functions
type HelperTestSuite struct {
	suite.Suite
	controller              *Controller
	mockWordPeer            *mocks.MockWordPeer
	mockWordDefinitionPeer  *mocks.MockWordDefinitionsPeer
	mockWordPracticeLogPeer *mocks.MockWordPracticeLogPeer
}

// TestHelperTestSuite runs the HelperTestSuite
func TestHelperTestSuite(t *testing.T) {
	suite.Run(t, new(HelperTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *HelperTestSuite) SetupTest() {
	suite.mockWordPeer = mocks.NewMockWordPeer(suite.T())
	suite.mockWordDefinitionPeer = mocks.NewMockWordDefinitionsPeer(suite.T())
	suite.mockWordPracticeLogPeer = mocks.NewMockWordPracticeLogPeer(suite.T())
	suite.controller = New(suite.mockWordPeer, suite.mockWordDefinitionPeer, suite.mockWordPracticeLogPeer)
}

// createGinContext creates a gin context with request body for testing
func (suite *HelperTestSuite) createGinContext(requestBody string) *gin.Context {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest("POST", "/test", io.NopCloser(bytes.NewReader([]byte(requestBody))))
	ctx.Request.Header.Set("Content-Type", "application/json")
	return ctx
}

// createTestError creates a test error for mock expectations
func (suite *HelperTestSuite) createTestError() error {
	return errors.New("test error")
}

// getSampleWords returns sample words for testing
func (suite *HelperTestSuite) getSampleWords() []*dbModels.Word {
	id1, id2 := 1, 2
	word1, word2 := "apple", "banana"
	fam1, fam2 := "green", "yellow"

	return []*dbModels.Word{
		{Id: &id1, Word: &word1, Familiarity: &fam1},
		{Id: &id2, Word: &word2, Familiarity: &fam2},
	}
}

// getSampleWordDefinitions returns sample word definitions for testing
func (suite *HelperTestSuite) getSampleWordDefinitions() []*dbModels.WordDefinition {
	id1, id2 := 1, 2
	wordId1, wordId2 := 1, 2
	pos := "noun"
	def1, def2 := "a fruit", "yellow fruit"

	return []*dbModels.WordDefinition{
		{Id: &id1, WordId: &wordId1, PartOfSpeech: &pos, Definition: &def1},
		{Id: &id2, WordId: &wordId2, PartOfSpeech: &pos, Definition: &def2},
	}
}
