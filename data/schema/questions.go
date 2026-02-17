package schema

import "word-flashcard/utils/database/domain"

const (
	QUESTION_TABLE_NAME             = "questions"
	QUESTION_ID                     = COMMON_ID
	QUESTION_QUESTION               = "question"
	QUESTION_OPTION_A               = "option_a"
	QUESTION_OPTION_B               = "option_b"
	QUESTION_OPTION_C               = "option_c"
	QUESTION_OPTION_D               = "option_d"
	QUESTION_ANSWER                 = "answer"
	QUESTION_REFERENCE              = "reference"
	QUESTION_NOTES                  = "notes"
	QUESTION_COUNT_PRACTISE         = "count_practise"
	QUESTION_COUNT_FAILURE_PRACTISE = "count_failure_practise"
)

// QuestionsTable defines the questions table structure
func QuestionsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: QUESTION_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          QUESTION_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    QUESTION_QUESTION,
				Type:    domain.VarcharType(1024),
				NotNull: true,
			},
			{
				Name:    QUESTION_OPTION_A,
				Type:    domain.VarcharType(255),
				NotNull: true,
			},
			{
				Name:    QUESTION_OPTION_B,
				Type:    domain.VarcharType(255),
				NotNull: false,
			},
			{
				Name:    QUESTION_OPTION_C,
				Type:    domain.VarcharType(255),
				NotNull: false,
			},
			{
				Name:    QUESTION_OPTION_D,
				Type:    domain.VarcharType(255),
				NotNull: false,
			},
			{
				Name:    QUESTION_ANSWER,
				Type:    domain.VarcharType(5),
				NotNull: true,
			},
			{
				Name:    QUESTION_REFERENCE,
				Type:    domain.VarcharType(255),
				NotNull: false,
			},
			{
				Name:    QUESTION_NOTES,
				Type:    domain.TextType,
				NotNull: false,
			},
			{
				Name:    QUESTION_COUNT_PRACTISE,
				Type:    domain.IntType,
				NotNull: true,
				Default: "0",
			},
			{
				Name:    QUESTION_COUNT_FAILURE_PRACTISE,
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
		Description: "Question records for recapping to improve the skill",
	}
}
