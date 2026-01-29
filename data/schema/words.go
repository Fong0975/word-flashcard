package schema

import "word-flashcard/utils/database/domain"

const (
	WORD_TABLE_NAME  = "words"
	WORD_ID          = COMMON_ID
	WORD_WORD        = "word"
	WORD_FAMILIARITY = "familiarity"
)

// WordsTable defines the words table structure
func WordsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: WORD_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          WORD_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    WORD_WORD,
				Type:    domain.VarcharType(255),
				NotNull: true,
				Unique:  true,
			},
			{
				Name:    WORD_FAMILIARITY,
				Type:    domain.VarcharType(20),
				NotNull: true,
				Default: "'red'",
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
		Indexes:     []domain.Index{},
		Description: "Dictionary words with their definitions",
	}
}
