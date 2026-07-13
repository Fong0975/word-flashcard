package schema

import "word-flashcard/utils/database/domain"

const (
	QUESTION_ANSWER_LOG_TABLE_NAME      = "question_answer_logs"
	QUESTION_ANSWER_LOG_ID              = COMMON_ID
	QUESTION_ANSWER_LOG_QUESTION_ID     = "question_id"
	QUESTION_ANSWER_LOG_SELECTED_OPTION = "selected_option"
	QUESTION_ANSWER_LOG_IS_CORRECT      = "is_correct"
)

// QuestionAnswerLogsTable defines the question_answer_logs table structure.
// Each row is an append-only record of a single quiz answer, including which
// option was selected. selected_option must always refer to the question's
// own option_a-d ordering, not the shuffled order shown during the quiz, so
// per-option error rates can be derived correctly.
func QuestionAnswerLogsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: QUESTION_ANSWER_LOG_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          QUESTION_ANSWER_LOG_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    QUESTION_ANSWER_LOG_QUESTION_ID,
				Type:    domain.IntType,
				NotNull: true,
				Index:   true,
				ForeignKey: &domain.ForeignKey{
					Table:  QUESTION_TABLE_NAME,
					Column: QUESTION_ID,
				},
			},
			{
				Name:    QUESTION_ANSWER_LOG_SELECTED_OPTION,
				Type:    domain.VarcharType(5),
				NotNull: true,
			},
			{
				Name:    QUESTION_ANSWER_LOG_IS_CORRECT,
				Type:    domain.BooleanType,
				NotNull: true,
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
		Description: "Append-only log of each quiz answer for a question, including the selected option",
	}
}
