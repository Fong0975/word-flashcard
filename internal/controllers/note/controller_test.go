package note

import (
	"testing"
	"time"
	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
	"word-flashcard/utils"

	"github.com/stretchr/testify/suite"
)

// ControllerTestSuite is a test suite for the note Controller
type ControllerTestSuite struct {
	suite.Suite
	controller   *Controller
	mockNotePeer *mocks.MockNotePeer
}

// TestControllerTestSuite runs the ControllerTestSuite
func TestControllerTestSuite(t *testing.T) {
	suite.Run(t, new(ControllerTestSuite))
}

// SetupTest sets up the test environment before each test
func (suite *ControllerTestSuite) SetupTest() {
	suite.mockNotePeer = mocks.NewMockNotePeer(suite.T())
	suite.controller = New(suite.mockNotePeer)
}

var testNoteModifyTime = time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

// getSampleNotes returns sample Note db models for testing
func getSampleNotes() []*dbModels.Note {
	testData := []struct {
		title     string
		content   string
		sortOrder int
	}{
		{
			title:     "Grammar Rules",
			content:   "# Grammar\n- Subject-Verb Agreement",
			sortOrder: 1,
		},
		{
			title:     "Vocabulary",
			content:   "# Vocabulary\n- Common words list",
			sortOrder: 2,
		},
		{
			title:     "Pronunciation",
			content:   "# Pronunciation\n- IPA symbols guide",
			sortOrder: 3,
		},
	}

	notes := make([]*dbModels.Note, 0, len(testData))
	for index, data := range testData {
		newID := index + 1
		notes = append(notes, &dbModels.Note{
			Id:        &newID,
			Title:     &data.title,
			Content:   &data.content,
			SortOrder: &data.sortOrder,
			CreatedAt: &testNoteModifyTime,
			UpdatedAt: &testNoteModifyTime,
		})
	}

	return notes
}

// getExpectedNotes returns expected Note API models for testing
func getExpectedNotes() []*models.Note {
	return []*models.Note{
		{
			ID:        utils.IntPtr(1),
			Title:     utils.StrPtr("Grammar Rules"),
			Content:   utils.StrPtr("# Grammar\n- Subject-Verb Agreement"),
			SortOrder: utils.IntPtr(1),
			UpdatedAt: &testNoteModifyTime,
		},
		{
			ID:        utils.IntPtr(2),
			Title:     utils.StrPtr("Vocabulary"),
			Content:   utils.StrPtr("# Vocabulary\n- Common words list"),
			SortOrder: utils.IntPtr(2),
			UpdatedAt: &testNoteModifyTime,
		},
		{
			ID:        utils.IntPtr(3),
			Title:     utils.StrPtr("Pronunciation"),
			Content:   utils.StrPtr("# Pronunciation\n- IPA symbols guide"),
			SortOrder: utils.IntPtr(3),
			UpdatedAt: &testNoteModifyTime,
		},
	}
}
