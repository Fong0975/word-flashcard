package question

import (
	"errors"
	"strings"

	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
	"word-flashcard/utils"
)

// TestValidateQuestionFields test the validateQuestionFields function
func (suite *HelperTestSuite) TestValidateQuestionFields() {
	type questionTestCase struct {
		name       string
		input      *models.Question
		isUpdate   bool
		wantErr    bool
		wantErrMsg string
		wantDetail []any
	}

	testQuestion := models.Question{
		ID:                   utils.IntPtr(1),
		Question:             utils.StrPtr("The marketing department has decided to ______ the new product launch until next month."),
		OptionA:              utils.StrPtr("postpone"),
		OptionB:              utils.StrPtr("postpone"),
		OptionC:              utils.StrPtr("postponing"),
		OptionD:              utils.StrPtr("postponement"),
		Answer:               utils.StrPtr("A"),
		Reference:            utils.StrPtr("Google Gemini Sample Q01"),
		Notes:                utils.StrPtr("- 情態助動詞 `have (decided to)` 之後應接動詞原形。\\n- 句意為「行銷部已決定將新產品發布延至下個月」。"),
		CountPractise:        utils.IntPtr(10),
		CountFailurePractise: utils.IntPtr(2),
	}

	testCases := []questionTestCase{
		{
			name: "create",
			input: func() *models.Question {
				q := testQuestion
				return &q
			}(),
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - nil question",
			input: func() *models.Question {
				q := testQuestion
				q.Question = nil
				return &q
			}(),
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "question is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "update - invalid question",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 1025)
				q.Question = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "question is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 1025, "max", 1024},
		},
		{
			name: "create - nil option_a",
			input: func() *models.Question {
				q := testQuestion
				q.OptionA = nil
				return &q
			}(),
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "option_a is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "update - invalid option_a",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionA = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "option_a is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "update - invalid option_b",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionB = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "option_b is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "update - invalid option_c",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionC = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "option_c is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "update - invalid option_d",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.OptionD = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "option_d is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "create - nil answer",
			input: func() *models.Question {
				q := testQuestion
				q.Answer = nil
				return &q
			}(),
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "answer is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "update - answer too long",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 6)
				q.Answer = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "answer is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 6, "max", 5},
		},
		{
			name: "update - answer not in A-D",
			input: func() *models.Question {
				q := testQuestion
				q.Answer = utils.StrPtr("F")
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "answer is invalid",
			wantDetail: []any{"value", "F", "allowed", "A,B,C,D"},
		},
		{
			name: "update - invalid reference",
			input: func() *models.Question {
				q := testQuestion
				invalidStr := strings.Repeat("q", 256)
				q.Reference = &invalidStr
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "reference is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "update - invalid count_practise",
			input: func() *models.Question {
				q := testQuestion
				q.CountPractise = utils.IntPtr(-1)
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "count_practise is invalid",
			wantDetail: []any{"reason", "negative value", "value", -1},
		},
		{
			name: "update - invalid count_failure_practise",
			input: func() *models.Question {
				q := testQuestion
				q.CountFailurePractise = utils.IntPtr(-1)
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "count_failure_practise is invalid",
			wantDetail: []any{"reason", "negative value", "value", -1},
		},
		{
			name: "update - invalid count_failure_practise (lager than count_practise)",
			input: func() *models.Question {
				q := testQuestion
				q.CountPractise = utils.IntPtr(5)
				q.CountFailurePractise = utils.IntPtr(6)
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "count_failure_practise is invalid",
			wantDetail: []any{"reason", "exceeds count_practise", "count_failure_practise", 6, "count_practise", 5},
		},
		{
			name: "update - count_failure_practise without count_practise",
			input: func() *models.Question {
				q := testQuestion
				q.CountPractise = nil
				q.CountFailurePractise = utils.IntPtr(1)
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "count_failure_practise is invalid",
			wantDetail: []any{"reason", "count_practise is required when count_failure_practise is set"},
		},
		{
			name: "update - invalid selected_option",
			input: func() *models.Question {
				q := testQuestion
				q.SelectedOption = utils.StrPtr("Z")
				return &q
			}(),
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "selected_option is invalid",
			wantDetail: []any{"value", "Z", "allowed", "A,B,C,D"},
		},
	}

	// Run the test cases and validate the result
	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := suite.controller.validateQuestionFields(tc.input, tc.isUpdate)
			if tc.wantErr {
				suite.Error(err)
				// The public-facing message must stay unchanged (frontend exposure level).
				suite.Equal(tc.wantErrMsg, err.Error())

				// The internal detail must be attached for log enrichment, but never
				// exposed through Error() -- i.e. never shown to the client.
				var de *common.DetailedError
				suite.Require().True(errors.As(err, &de), "expected a *common.DetailedError to carry log detail")
				suite.Equal(tc.wantDetail, de.LogDetail())
			} else {
				suite.NoError(err)
			}
		})
	}
}
