package backup

import (
	"testing"

	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"

	"github.com/stretchr/testify/suite"
)

// ValidationTestSuite is a test suite for the backup export field validators
type ValidationTestSuite struct {
	suite.Suite
}

// TestValidationTestSuite runs the ValidationTestSuite
func TestValidationTestSuite(t *testing.T) {
	suite.Run(t, new(ValidationTestSuite))
}

// TestValidateExport verifies validateExport delegates to each table's own
// validator in order (words, word_definitions, questions,
// question_answer_logs, word_practice_logs, notes), stopping at the first
// table that fails.
func (suite *ValidationTestSuite) TestValidateExport() {
	testCases := []struct {
		name       string
		export     *models.DataExport
		wantErr    bool
		wantErrMsg string
	}{
		{
			name:    "empty export is valid",
			export:  &models.DataExport{},
			wantErr: false,
		},
		{
			name: "fully populated valid export",
			export: &models.DataExport{
				Words:              []*dbModels.Word{sampleWord(1)},
				WordDefinitions:    []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
				Questions:          []*dbModels.Question{sampleQuestion(1)},
				QuestionAnswerLogs: []*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)},
				WordPracticeLogs:   []*dbModels.WordPracticeLog{sampleWordPracticeLog(1, 1)},
				Notes:              []*dbModels.Note{sampleNote(1)},
			},
			wantErr: false,
		},
		{
			name: "invalid words is reported before any other table is checked",
			export: &models.DataExport{
				Words: []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.Word = nil; return w }()},
			},
			wantErr:    true,
			wantErrMsg: "words[0]: word is required",
		},
		{
			name: "invalid word_definitions is reached once words are valid",
			export: &models.DataExport{
				Words:           []*dbModels.Word{sampleWord(1)},
				WordDefinitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.PartOfSpeech = nil; return d }()},
			},
			wantErr:    true,
			wantErrMsg: "word_definitions[0]: part_of_speech is required",
		},
		{
			name: "invalid questions is reached once words/word_definitions are valid",
			export: &models.DataExport{
				Words:           []*dbModels.Word{sampleWord(1)},
				WordDefinitions: []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
				Questions:       []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.OptionA = nil; return q }()},
			},
			wantErr:    true,
			wantErrMsg: "questions[0]: option_a is required",
		},
		{
			name: "invalid question_answer_logs is reached once preceding tables are valid",
			export: &models.DataExport{
				Words:              []*dbModels.Word{sampleWord(1)},
				WordDefinitions:    []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
				Questions:          []*dbModels.Question{sampleQuestion(1)},
				QuestionAnswerLogs: []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.IsCorrect = nil; return l }()},
			},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: is_correct is required",
		},
		{
			name: "invalid word_practice_logs is reached once preceding tables are valid",
			export: &models.DataExport{
				Words:              []*dbModels.Word{sampleWord(1)},
				WordDefinitions:    []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
				Questions:          []*dbModels.Question{sampleQuestion(1)},
				QuestionAnswerLogs: []*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)},
				WordPracticeLogs:   []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.Familiarity = nil; return l }()},
			},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: familiarity is required",
		},
		{
			name: "invalid notes is reached last, once every other table is valid",
			export: &models.DataExport{
				Words:              []*dbModels.Word{sampleWord(1)},
				WordDefinitions:    []*dbModels.WordDefinition{sampleWordDefinition(1, 1)},
				Questions:          []*dbModels.Question{sampleQuestion(1)},
				QuestionAnswerLogs: []*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)},
				WordPracticeLogs:   []*dbModels.WordPracticeLog{sampleWordPracticeLog(1, 1)},
				Notes:              []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.SortOrder = nil; return n }()},
			},
			wantErr:    true,
			wantErrMsg: "notes[0]: sort_order is required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateExport(tc.export)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateWords tests the validateWords function
func (suite *ValidationTestSuite) TestValidateWords() {
	testCases := []struct {
		name       string
		words      []*dbModels.Word
		wantErr    bool
		wantErrMsg string
	}{
		{name: "empty slice is valid", words: nil, wantErr: false},
		{name: "valid word", words: []*dbModels.Word{sampleWord(1)}, wantErr: false},
		{
			name:       "nil id",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.Id = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: id is required",
		},
		{
			name:       "nil word",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.Word = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: word is required",
		},
		{
			name:       "nil familiarity",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.Familiarity = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: familiarity is required",
		},
		{
			name:       "nil count_practise",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.CountPractise = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: count_practise is required",
		},
		{
			name:       "nil created_at",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.CreatedAt = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: created_at/updated_at are required",
		},
		{
			name:       "nil updated_at",
			words:      []*dbModels.Word{func() *dbModels.Word { w := sampleWord(1); w.UpdatedAt = nil; return w }()},
			wantErr:    true,
			wantErrMsg: "words[0]: created_at/updated_at are required",
		},
		{
			name: "second row invalid reports its own index",
			words: []*dbModels.Word{
				sampleWord(1),
				func() *dbModels.Word { w := sampleWord(2); w.Word = nil; return w }(),
			},
			wantErr:    true,
			wantErrMsg: "words[1]: word is required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWords(tc.words)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateWordDefinitions tests the validateWordDefinitions function
func (suite *ValidationTestSuite) TestValidateWordDefinitions() {
	testCases := []struct {
		name        string
		definitions []*dbModels.WordDefinition
		wantErr     bool
		wantErrMsg  string
	}{
		{name: "empty slice is valid", definitions: nil, wantErr: false},
		{name: "valid word definition", definitions: []*dbModels.WordDefinition{sampleWordDefinition(1, 1)}, wantErr: false},
		{
			name:        "nil id",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.Id = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: id is required",
		},
		{
			name:        "nil word_id",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.WordId = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: word_id is required",
		},
		{
			name:        "nil part_of_speech",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.PartOfSpeech = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: part_of_speech is required",
		},
		{
			name:        "nil definition",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.Definition = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: definition is required",
		},
		{
			name:        "nil created_at",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.CreatedAt = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: created_at/updated_at are required",
		},
		{
			name:        "nil updated_at",
			definitions: []*dbModels.WordDefinition{func() *dbModels.WordDefinition { d := sampleWordDefinition(1, 1); d.UpdatedAt = nil; return d }()},
			wantErr:     true,
			wantErrMsg:  "word_definitions[0]: created_at/updated_at are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordDefinitions(tc.definitions)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateQuestions tests the validateQuestions function
func (suite *ValidationTestSuite) TestValidateQuestions() {
	testCases := []struct {
		name       string
		questions  []*dbModels.Question
		wantErr    bool
		wantErrMsg string
	}{
		{name: "empty slice is valid", questions: nil, wantErr: false},
		{name: "valid question", questions: []*dbModels.Question{sampleQuestion(1)}, wantErr: false},
		{
			name:       "nil id",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.Id = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: id is required",
		},
		{
			name:       "nil question",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.Question = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: question is required",
		},
		{
			name:       "nil option_a",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.OptionA = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: option_a is required",
		},
		{
			name:       "nil answer",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.Answer = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: answer is required",
		},
		{
			name:       "nil count_practise",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.CountPractise = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: count_practise/count_failure_practise are required",
		},
		{
			name:       "nil count_failure_practise",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.CountFailurePractise = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: count_practise/count_failure_practise are required",
		},
		{
			name:       "nil created_at",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.CreatedAt = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: created_at/updated_at are required",
		},
		{
			name:       "nil updated_at",
			questions:  []*dbModels.Question{func() *dbModels.Question { q := sampleQuestion(1); q.UpdatedAt = nil; return q }()},
			wantErr:    true,
			wantErrMsg: "questions[0]: created_at/updated_at are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateQuestions(tc.questions)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateQuestionAnswerLogs tests the validateQuestionAnswerLogs function
func (suite *ValidationTestSuite) TestValidateQuestionAnswerLogs() {
	testCases := []struct {
		name       string
		logs       []*dbModels.QuestionAnswerLog
		wantErr    bool
		wantErrMsg string
	}{
		{name: "empty slice is valid", logs: nil, wantErr: false},
		{name: "valid log", logs: []*dbModels.QuestionAnswerLog{sampleQuestionAnswerLog(1, 1)}, wantErr: false},
		{
			name:       "nil id",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.Id = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: id is required",
		},
		{
			name:       "nil question_id",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.QuestionId = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: question_id is required",
		},
		{
			name:       "nil selected_option",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.SelectedOption = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: selected_option is required",
		},
		{
			name:       "nil is_correct",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.IsCorrect = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: is_correct is required",
		},
		{
			name:       "nil created_at",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.CreatedAt = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: created_at/updated_at are required",
		},
		{
			name:       "nil updated_at",
			logs:       []*dbModels.QuestionAnswerLog{func() *dbModels.QuestionAnswerLog { l := sampleQuestionAnswerLog(1, 1); l.UpdatedAt = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "question_answer_logs[0]: created_at/updated_at are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateQuestionAnswerLogs(tc.logs)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateWordPracticeLogs tests the validateWordPracticeLogs function
func (suite *ValidationTestSuite) TestValidateWordPracticeLogs() {
	testCases := []struct {
		name       string
		logs       []*dbModels.WordPracticeLog
		wantErr    bool
		wantErrMsg string
	}{
		{name: "empty slice is valid", logs: nil, wantErr: false},
		{name: "valid log", logs: []*dbModels.WordPracticeLog{sampleWordPracticeLog(1, 1)}, wantErr: false},
		{
			name:       "nil id",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.Id = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: id is required",
		},
		{
			name:       "nil word_id",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.WordId = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: word_id is required",
		},
		{
			name:       "nil familiarity",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.Familiarity = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: familiarity is required",
		},
		{
			name:       "nil previous_familiarity",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.PreviousFamiliarity = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: previous_familiarity is required",
		},
		{
			name:       "nil created_at",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.CreatedAt = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: created_at/updated_at are required",
		},
		{
			name:       "nil updated_at",
			logs:       []*dbModels.WordPracticeLog{func() *dbModels.WordPracticeLog { l := sampleWordPracticeLog(1, 1); l.UpdatedAt = nil; return l }()},
			wantErr:    true,
			wantErrMsg: "word_practice_logs[0]: created_at/updated_at are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordPracticeLogs(tc.logs)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}

// TestValidateNotes tests the validateNotes function
func (suite *ValidationTestSuite) TestValidateNotes() {
	testCases := []struct {
		name       string
		notes      []*dbModels.Note
		wantErr    bool
		wantErrMsg string
	}{
		{name: "empty slice is valid", notes: nil, wantErr: false},
		{name: "valid note", notes: []*dbModels.Note{sampleNote(1)}, wantErr: false},
		{
			name:       "nil id",
			notes:      []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.Id = nil; return n }()},
			wantErr:    true,
			wantErrMsg: "notes[0]: id is required",
		},
		{
			name:       "nil title",
			notes:      []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.Title = nil; return n }()},
			wantErr:    true,
			wantErrMsg: "notes[0]: title is required",
		},
		{
			name:       "nil sort_order",
			notes:      []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.SortOrder = nil; return n }()},
			wantErr:    true,
			wantErrMsg: "notes[0]: sort_order is required",
		},
		{
			name:       "nil created_at",
			notes:      []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.CreatedAt = nil; return n }()},
			wantErr:    true,
			wantErrMsg: "notes[0]: created_at/updated_at are required",
		},
		{
			name:       "nil updated_at",
			notes:      []*dbModels.Note{func() *dbModels.Note { n := sampleNote(1); n.UpdatedAt = nil; return n }()},
			wantErr:    true,
			wantErrMsg: "notes[0]: created_at/updated_at are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateNotes(tc.notes)
			if tc.wantErr {
				suite.Error(err)
				suite.Equal(tc.wantErrMsg, err.Error())
			} else {
				suite.NoError(err)
			}
		})
	}
}
