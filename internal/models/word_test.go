package models

import (
	"encoding/json"
	"github.com/stretchr/testify/suite"
	"testing"
	"word-flashcard/data/models"
)

// WordModelTestSuite contains all Word model related tests
type WordModelTestSuite struct {
	suite.Suite
}

// TestWordModelTestSuite runs all Word model tests using the test suite
func TestWordModelTestSuite(t *testing.T) {
	suite.Run(t, new(WordModelTestSuite))
}

// TestFromDataModel_WithAndWithoutDefinitions tests the FromDataModel method of the Word model
func (ws *WordModelTestSuite) TestFromDataModel() {
	// Arrange
	w := &Word{}

	wordID := 1
	wordText := "test"
	fam := "3"

	dm := &models.Word{
		Id:          &wordID,
		Word:        &wordText,
		Familiarity: &fam,
	}

	defID := 10
	pos := "noun"
	defText := "a procedure intended to establish quality"
	phoneticsJSON := `{"uk":"test","us":"tɛst"}`
	examplesJSON := `["This is a test.","Run a test case."]`
	notes := "Some notes"

	defs := []*models.WordDefinition{
		{
			Id:           &defID,
			PartOfSpeech: &pos,
			Definition:   &defText,
			Phonetics:    &phoneticsJSON,
			Examples:     &examplesJSON,
			Notes:        &notes,
		},
	}

	// Act
	result := w.FromDataModel(dm, defs)

	// Assert - Word basic fields
	if ws.NotNil(result.ID) {
		ws.Equal(wordID, *result.ID)
	}
	if ws.NotNil(result.Word) {
		ws.Equal(wordText, *result.Word)
	}
	if ws.NotNil(result.Familiarity) {
		ws.Equal(fam, *result.Familiarity)
	}

	// Assert - Definitions
	if ws.Len(result.Definitions, 1) {
		def := result.Definitions[0]

		if ws.NotNil(def.ID) {
			ws.Equal(defID, *def.ID)
		}
		if ws.NotNil(def.PartOfSpeech) {
			ws.Equal(pos, *def.PartOfSpeech)
		}
		if ws.NotNil(def.Definition) {
			ws.Equal(defText, *def.Definition)
		}

		if ws.NotNil(def.Phonetics) {
			ws.Equal("test", (*def.Phonetics)["uk"])
			ws.Equal("tɛst", (*def.Phonetics)["us"])
		}

		if ws.NotNil(def.Examples) {
			ws.ElementsMatch([]string{"This is a test.", "Run a test case."}, *def.Examples)
		}

		if ws.NotNil(def.Notes) {
			ws.Equal("Some notes", *def.Notes)
		}
	}

	// Act - empty defs case
	w2 := &Word{}
	result2 := w2.FromDataModel(dm, []*models.WordDefinition{})

	// Assert - empty definitions
	ws.NotNil(result2.Definitions)
	ws.Len(result2.Definitions, 0)
}

// TestToDataModel_BasicFieldsCopied tests the ToDataModel method of the Word model
func (ws *WordModelTestSuite) TestWordToDataModel() {
	// Arrange
	id := 5
	wordText := "example"
	fam := "high"

	w := &Word{
		ID:          &id,
		Word:        &wordText,
		Familiarity: &fam,
	}

	// Act
	dm := w.ToDataModel()

	// Assert
	ws.NotNil(dm)

	if ws.NotNil(dm.Id) {
		ws.Equal(id, *dm.Id)
	}
	if ws.NotNil(dm.Word) {
		ws.Equal(wordText, *dm.Word)
	}
	if ws.NotNil(dm.Familiarity) {
		ws.Equal(fam, *dm.Familiarity)
	}
}

// TestToDataModel_PhoneticsAndExamplesMarshaled tests the ToDataModel method of the WordDefinition model
func (ws *WordModelTestSuite) TestWordDefinitionToDataModel() {
	// Arrange
	id := 100
	pos := "verb"
	defText := "to examine something carefully"
	notes := "common usage"

	phoneticsMap := map[string]interface{}{
		"uk": "ɪɡˈzɑːmɪn",
		"us": "ɪɡˈzæmɪn",
	}
	examplesSlice := []string{
		"Please examine the report.",
		"The doctor examined the patient.",
	}

	wd := &WordDefinition{
		ID:           &id,
		PartOfSpeech: &pos,
		Definition:   &defText,
		Phonetics:    &phoneticsMap,
		Examples:     &examplesSlice,
		Notes:        &notes,
	}

	// Act
	dm := wd.ToDataModel()

	// Assert
	ws.NotNil(dm)

	if ws.NotNil(dm.Id) {
		ws.Equal(id, *dm.Id)
	}
	if ws.NotNil(dm.PartOfSpeech) {
		ws.Equal(pos, *dm.PartOfSpeech)
	}
	if ws.NotNil(dm.Definition) {
		ws.Equal(defText, *dm.Definition)
	}
	if ws.NotNil(dm.Notes) {
		ws.Equal(notes, *dm.Notes)
	}

	// Phonetics should be marshaled to JSON string
	if ws.NotNil(dm.Phonetics) {
		var gotPhonetics map[string]interface{}
		err := json.Unmarshal([]byte(*dm.Phonetics), &gotPhonetics)
		ws.NoError(err)
		ws.Equal(phoneticsMap["uk"], gotPhonetics["uk"])
		ws.Equal(phoneticsMap["us"], gotPhonetics["us"])
	}

	// Examples should be marshaled to JSON string
	if ws.NotNil(dm.Examples) {
		var gotExamples []string
		err := json.Unmarshal([]byte(*dm.Examples), &gotExamples)
		ws.NoError(err)
		ws.ElementsMatch(examplesSlice, gotExamples)
	}
}
