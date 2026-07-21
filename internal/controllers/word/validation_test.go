package word

import (
	"errors"
	"strings"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// TestParseAndValidateWordRequest tests the parseAndValidateWordRequest function
func (suite *HelperTestSuite) TestParseAndValidateWordRequest() {
	type testCase struct {
		name        string
		requestBody string
		isUpdate    bool
		wantErr     bool
	}

	testCases := []testCase{
		{
			name:        "create - valid word data",
			requestBody: `{"word": "apple", "familiarity": "green"}`,
			isUpdate:    false,
			wantErr:     false,
		},
		{
			name:        "create - missing required word",
			requestBody: `{"familiarity": "green"}`,
			isUpdate:    false,
			wantErr:     true,
		},
		{
			name:        "update - valid data",
			requestBody: `{"familiarity": "yellow"}`,
			isUpdate:    true,
			wantErr:     false,
		},
		{
			name:        "invalid json format",
			requestBody: `{"word": "apple"`,
			isUpdate:    false,
			wantErr:     true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := suite.createGinContext(tc.requestBody)

			result, err := suite.controller.parseAndValidateWordRequest(ctx, tc.isUpdate)

			if tc.wantErr {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				suite.NotNil(result)
			}
		})
	}
}

// TestParseAndValidateWordDefinitionRequest tests the parseAndValidateWordDefinitionRequest function
func (suite *HelperTestSuite) TestParseAndValidateWordDefinitionRequest() {
	type testCase struct {
		name        string
		requestBody string
		isUpdate    bool
		wantErr     bool
	}

	testCases := []testCase{
		{
			name:        "create - valid definition data",
			requestBody: `{"part_of_speech": "noun", "definition": "a fruit"}`,
			isUpdate:    false,
			wantErr:     false,
		},
		{
			name:        "create - missing required part_of_speech",
			requestBody: `{"definition": "a fruit"}`,
			isUpdate:    false,
			wantErr:     true,
		},
		{
			name:        "update - valid data",
			requestBody: `{"definition": "updated definition"}`,
			isUpdate:    true,
			wantErr:     false,
		},
		{
			name:        "invalid json format",
			requestBody: `{"part_of_speech": "noun"`,
			isUpdate:    false,
			wantErr:     true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			ctx := suite.createGinContext(tc.requestBody)

			result, err := suite.controller.parseAndValidateWordDefinitionRequest(ctx, tc.isUpdate)

			if tc.wantErr {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				suite.NotNil(result)
			}
		})
	}
}

// TestValidateWordFields tests the validateWordFields function
func (suite *HelperTestSuite) TestValidateWordFields() {
	type testCase struct {
		name       string
		input      *models.Word
		isUpdate   bool
		wantErr    bool
		wantErrMsg string
		wantDetail []any
	}

	validWord := "example"
	longWord := strings.Repeat("a", 256)
	validFam := schema.WORD_FAMILIARITY_GREEN
	invalidFam := "blue"
	longReminder := strings.Repeat("r", 101)
	longQuizSessionID := strings.Repeat("s", 37)

	testCases := []testCase{
		{
			name: "create - valid word and familiarity",
			input: &models.Word{
				Word:        &validWord,
				Familiarity: &validFam,
			},
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - missing word",
			input: &models.Word{
				Familiarity: &validFam,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "word is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "update - invalid familiarity",
			input: &models.Word{
				Word:        &validWord,
				Familiarity: &invalidFam,
			},
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "familiarity is invalid",
			wantDetail: []any{"value", invalidFam, "allowed", strings.Join([]string{
				schema.WORD_FAMILIARITY_RED, schema.WORD_FAMILIARITY_YELLOW, schema.WORD_FAMILIARITY_GREEN,
			}, ",")},
		},
		{
			name: "create - word too long",
			input: &models.Word{
				Word: &longWord,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "word is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 256, "max", 255},
		},
		{
			name: "create - reminder too long",
			input: &models.Word{
				Word:        &validWord,
				Familiarity: &validFam,
				Reminder:    &longReminder,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "reminder is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 101, "max", 100},
		},
		{
			name: "update - quiz_session_id too long",
			input: &models.Word{
				Word:          &validWord,
				Familiarity:   &validFam,
				QuizSessionID: &longQuizSessionID,
			},
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "quiz_session_id is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 37, "max", 36},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordFields(tc.input, tc.isUpdate)
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

// TestValidateWordDefinitionFields tests the validateWordDefinitionFields function
func (suite *HelperTestSuite) TestValidateWordDefinitionFields() {
	type testCase struct {
		name       string
		input      models.WordDefinition
		isUpdate   bool
		wantErr    bool
		wantErrMsg string
		wantDetail []any
	}

	validPOS := "noun"
	validDef := "a short definition"
	longPOS := strings.Repeat("a", 51)
	longText := strings.Repeat("b", 21846)

	testCases := []testCase{
		{
			name: "create - valid fields",
			input: models.WordDefinition{
				PartOfSpeech: &validPOS,
				Definition:   &validDef,
			},
			isUpdate: false,
			wantErr:  false,
		},
		{
			name: "create - missing part_of_speech",
			input: models.WordDefinition{
				Definition: &validDef,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "part_of_speech is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "update - too long part_of_speech",
			input: models.WordDefinition{
				PartOfSpeech: &longPOS,
				Definition:   &validDef,
			},
			isUpdate:   true,
			wantErr:    true,
			wantErrMsg: "part_of_speech is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 51, "max", 50},
		},
		{
			name: "create - missing definition",
			input: models.WordDefinition{
				PartOfSpeech: &validPOS,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "definition is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name: "create - too long definition",
			input: models.WordDefinition{
				PartOfSpeech: &validPOS,
				Definition:   &longText,
			},
			isUpdate:   false,
			wantErr:    true,
			wantErrMsg: "definition is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 21846, "max", 21845},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := validateWordDefinitionFields(tc.input, tc.isUpdate)
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
