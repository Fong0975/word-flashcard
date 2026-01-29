package schema

import "word-flashcard/utils/database/domain"

// WordDefinitionsTable defines the word_definitions table structure
func WordDefinitionsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: "word_definitions",
		Columns: []domain.Column{
			{
				Name:          "id",
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    "word_id",
				Type:    domain.IntType,
				NotNull: true,
				Index:   true,
				ForeignKey: &domain.ForeignKey{
					Table:  "words",
					Column: "id",
				},
			},
			{
				Name:    "part_of_speech",
				Type:    domain.VarcharType(50),
				NotNull: false,
			},
			{
				Name:    "definition",
				Type:    domain.TextType,
				NotNull: true,
			},
			{
				Name:    "phonetics",
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    "examples",
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    "notes",
				Type:    domain.TextType,
				NotNull: false,
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
				Name:    "word_id_index",
				Columns: []string{"word_id"},
				Unique:  false,
			},
		},
		Description: "Word definitions with multiple entries per word",
	}
}
