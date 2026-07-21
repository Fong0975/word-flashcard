package schema

import "word-flashcard/utils/database/domain"

const (
	WORD_PRACTICE_LOG_TABLE_NAME           = "word_practice_logs"
	WORD_PRACTICE_LOG_ID                   = COMMON_ID
	WORD_PRACTICE_LOG_WORD_ID              = "word_id"
	WORD_PRACTICE_LOG_FAMILIARITY          = "familiarity"
	WORD_PRACTICE_LOG_PREVIOUS_FAMILIARITY = "previous_familiarity"
	WORD_PRACTICE_LOG_QUIZ_SESSION_ID      = "quiz_session_id"
)

// WordPracticeLogsTable defines the word_practice_logs table structure.
// Each row is a record of a single quiz answer's familiarity change, so
// familiarity trends, practice streaks, and daily volume can be derived
// later without touching the words table's own running counters. Rows are
// append-only across distinct quiz sessions, but a resubmission for the
// same (word_id, quiz_session_id) pair -- i.e. the user navigating back and
// re-answering the same question within one quiz attempt -- corrects the
// existing row in place instead of adding a duplicate (see UpdateWord).
func WordPracticeLogsTable() *domain.TableDefinition {
	return &domain.TableDefinition{
		Name: WORD_PRACTICE_LOG_TABLE_NAME,
		Columns: []domain.Column{
			{
				Name:          WORD_PRACTICE_LOG_ID,
				Type:          domain.IntType,
				NotNull:       true,
				AutoIncrement: true,
				PrimaryKey:    true,
			},
			{
				Name:    WORD_PRACTICE_LOG_WORD_ID,
				Type:    domain.IntType,
				NotNull: true,
				Index:   true,
				ForeignKey: &domain.ForeignKey{
					Table:  WORD_TABLE_NAME,
					Column: WORD_ID,
				},
			},
			{
				Name:    WORD_PRACTICE_LOG_FAMILIARITY,
				Type:    domain.VarcharType(20),
				NotNull: true,
			},
			{
				Name:    WORD_PRACTICE_LOG_PREVIOUS_FAMILIARITY,
				Type:    domain.VarcharType(20),
				NotNull: true,
			},
			{
				Name:    WORD_PRACTICE_LOG_QUIZ_SESSION_ID,
				Type:    domain.VarcharType(36),
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
				Name:    "word_id_quiz_session_id_index",
				Columns: []string{WORD_PRACTICE_LOG_WORD_ID, WORD_PRACTICE_LOG_QUIZ_SESSION_ID},
				Unique:  true,
			},
		},
		Description: "Log of each quiz answer's familiarity change for a word",
	}
}
