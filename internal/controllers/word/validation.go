package word

import (
	"slices"
	"strings"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// parseAndValidateWordRequest parses and validates word data from HTTP request
func (wc *Controller) parseAndValidateWordRequest(c *gin.Context, isUpdate bool) (*models.Word, error) {
	var wordData models.Word
	err := common.ParseRequestBody(&wordData, c)
	if err != nil {
		return nil, err
	} else if err := validateWordFields(&wordData, isUpdate); err != nil {
		return nil, common.NewValidationError(err)
	}

	return &wordData, nil
}

// parseAndValidateWordDefinitionRequest parses and validates word definition data from HTTP request
func (wc *Controller) parseAndValidateWordDefinitionRequest(c *gin.Context, isUpdate bool) (*models.WordDefinition, error) {
	var wordDefinitionData models.WordDefinition
	if err := common.ParseRequestBody(&wordDefinitionData, c); err != nil {
		return nil, err
	} else if err := validateWordDefinitionFields(wordDefinitionData, isUpdate); err != nil {
		return nil, common.NewValidationError(err)
	}

	return &wordDefinitionData, nil
}

// validateWordFields validates word entity fields including business rules and constraints
func validateWordFields(wordData *models.Word, isUpdate bool) error {
	// Validate word field: VARCHAR(255), NOT NULL for creation
	if err := common.ValidateStringField(wordData.Word, isUpdate, "word", 255, false); err != nil {
		return err
	}

	// Validate familiarity enum values
	validFamiliarity := []string{schema.WORD_FAMILIARITY_RED, schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN}
	if wordData.Familiarity != nil && !slices.Contains(validFamiliarity, *wordData.Familiarity) {
		return common.NewFieldError("familiarity is invalid", "value", *wordData.Familiarity, "allowed", strings.Join(validFamiliarity, ","))
	}

	// Validate reminder field: VARCHAR(100), nullable
	return common.ValidateStringField(wordData.Reminder, isUpdate, "reminder", 100, true)
}

// validateWordDefinitionFields validates word definition entity fields including constraints
func validateWordDefinitionFields(definition models.WordDefinition, isUpdate bool) error {
	// Validate part_of_speech field: VARCHAR(50), required for creation
	if err := common.ValidateStringField(definition.PartOfSpeech, isUpdate, "part_of_speech", 50, false); err != nil {
		return err
	}

	// Validate definition field: TEXT, NOT NULL for creation
	if err := common.ValidateStringField(definition.Definition, isUpdate, "definition", 21845, false); err != nil {
		return err
	}

	// Validate phonetics field: TEXT, nullable
	if definition.Phonetics != nil && len(*definition.Phonetics) > 21845 {
		return common.NewFieldError("phonetics is invalid", "reason", "exceeds max length", "length", len(*definition.Phonetics), "max", 21845)
	}

	// Validate examples field: TEXT, nullable
	if definition.Examples != nil && len(*definition.Examples) > 21845 {
		return common.NewFieldError("examples is invalid", "reason", "exceeds max length", "length", len(*definition.Examples), "max", 21845)
	}

	return nil
}
