package schema

import "word-flashcard/utils/database/domain"

// WordsTable defines the words table structure
func WordsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: "words",
		Columns: []domain.Column{
			{
				Name:          "id",
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    "word",
				Type:    domain.VarcharType(255),
				NotNull: true,
				Index:   true,
			},
			{
				Name:    "familiarity",
				Type:    domain.VarcharType(20),
				NotNull: true,
				Default: "'red'",
			},
			{
				Name:    "created_at",
				Type:    domain.TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP",
			},
			{
				Name:    "updated_at",
				Type:    domain.TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
			},
		},
		Indexes: []domain.Index{
			{
				Name:    "word_unique",
				Columns: []string{"word"},
				Unique:  true,
			},
		},
		Description: "Dictionary words with their definitions",
	}
}
