package schema

import "word-flashcard/utils/database/domain"

const (
	NOTE_TABLE_NAME = "notes"
	NOTE_ID         = COMMON_ID
	NOTE_TITLE      = "title"
	NOTE_CONTENT    = "content"
	NOTE_SORT_ORDER = "sort_order"
)

// NotesTable defines the notes table structure
func NotesTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: NOTE_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          NOTE_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    NOTE_TITLE,
				Type:    domain.VarcharType(255),
				NotNull: true,
				Unique:  true,
			},
			{
				Name:    NOTE_CONTENT,
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    NOTE_SORT_ORDER,
				Type:    domain.IntType,
				NotNull: true,
				Default: "0",
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
		Description: "Note card records with Markdown content for display",
	}
}
