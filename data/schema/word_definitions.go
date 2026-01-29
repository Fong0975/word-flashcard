package schema

import "word-flashcard/utils/database/domain"

const (
	WORD_DEFINITIONS_TABLE_NAME     = "word_definitions"
	WORD_DEFINITIONS_ID             = COMMON_ID
	WORD_DEFINITIONS_WORD_ID        = "word_id"
	WORD_DEFINITIONS_PART_OF_SPEECH = "part_of_speech"
	WORD_DEFINITIONS_DEFINITION     = "definition"
	WORD_DEFINITIONS_PHONETICS      = "phonetics"
	WORD_DEFINITIONS_EXAMPLES       = "examples"
	WORD_DEFINITIONS_NOTES          = "notes"
)

// WordDefinitionsTable defines the word_definitions table structure
func WordDefinitionsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: WORD_DEFINITIONS_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          WORD_DEFINITIONS_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    WORD_DEFINITIONS_WORD_ID,
				Type:    domain.IntType,
				NotNull: true,
				Index:   true,
				ForeignKey: &domain.ForeignKey{
					Table:  WORD_TABLE_NAME,
					Column: WORD_ID,
				},
			},
			{
				Name:    WORD_DEFINITIONS_PART_OF_SPEECH,
				Type:    domain.VarcharType(50),
				NotNull: true,
			},
			{
				Name:    WORD_DEFINITIONS_DEFINITION,
				Type:    domain.TextType,
				NotNull: true,
			},
			{
				Name:    WORD_DEFINITIONS_PHONETICS,
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    WORD_DEFINITIONS_EXAMPLES,
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    WORD_DEFINITIONS_NOTES,
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    COMMON_CREATED_AT,
				Type:    domain.TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP",
			},
			{
				Name:    COMMON_UPDATED_AT,
				Type:    domain.TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
			},
		},
		Indexes: []domain.Index{
			{
				Name:    "word_id_index",
				Columns: []string{"word_id"},
				Unique:  false,
			},
		},
		Description: "Word definitions with multiple entries per word",
	}
}
