package domain

import "time"

// Word represents a word record from the database
type Word struct {
	ID         int       `db:"id" json:"id"`
	Word       string    `db:"word" json:"word"`
	Definition string    `db:"definition" json:"definition"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

// WordsTable defines the words table structure
func WordsTable() *TableDefinition {
	return &TableDefinition{
		Name: "words",
		Columns: []Column{
			{
				Name:          "id",
				Type:          IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    "word",
				Type:    VarcharType(255),
				NotNull: true,
				Index:   true,
			},
			{
				Name:    "definition",
				Type:    TextType,
				NotNull: true,
			},
			{
				Name:    "created_at",
				Type:    TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP",
			},
			{
				Name:    "updated_at",
				Type:    TimestampType,
				NotNull: true,
				Default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
			},
		},
		Indexes: []Index{
			{
				Name:    "word_unique",
				Columns: []string{"word"},
				Unique:  true,
			},
		},
		Description: "Dictionary words with their definitions",
	}
}
