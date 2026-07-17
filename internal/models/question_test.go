package models

import (
	"testing"

	"word-flashcard/utils"

	"github.com/stretchr/testify/suite"
)

// QuestionModelTestSuite contains all Question model related tests
type QuestionModelTestSuite struct {
	suite.Suite
}

// TestQuestionModelTestSuite runs all Question model tests using the test suite
func TestQuestionModelTestSuite(t *testing.T) {
	suite.Run(t, new(QuestionModelTestSuite))
}

// TestQuestionToDataModel tests the ToDataModel method of the Question model,
// focusing on the answer-uppercasing branch since the rest of the conversion
// is a straight field copy.
func (qs *QuestionModelTestSuite) TestQuestionToDataModel() {
	testCases := []struct {
		name           string
		answer         *string
		expectedAnswer *string
	}{
		{
			name:           "uppercase answer is preserved",
			answer:         utils.StrPtr("A"),
			expectedAnswer: utils.StrPtr("A"),
		},
		{
			name:           "lowercase answer is converted to uppercase",
			answer:         utils.StrPtr("b"),
			expectedAnswer: utils.StrPtr("B"),
		},
		{
			name:           "mixed-case answer is fully uppercased",
			answer:         utils.StrPtr("cD"),
			expectedAnswer: utils.StrPtr("CD"),
		},
		{
			name:           "nil answer remains nil",
			answer:         nil,
			expectedAnswer: nil,
		},
	}

	id := 1
	questionText := "What is the capital of France?"
	optionA := "Paris"
	reference := "Geography 101"
	notes := "Common knowledge"
	countPractise := 5
	countFailurePractise := 1

	for _, tc := range testCases {
		qs.T().Run(tc.name, func(t *testing.T) {
			q := &Question{
				ID:                   &id,
				Question:             &questionText,
				OptionA:              &optionA,
				Answer:               tc.answer,
				Reference:            &reference,
				Notes:                &notes,
				CountPractise:        &countPractise,
				CountFailurePractise: &countFailurePractise,
			}

			dm := q.ToDataModel()

			if tc.expectedAnswer == nil {
				qs.Nil(dm.Answer)
			} else if qs.NotNil(dm.Answer) {
				qs.Equal(*tc.expectedAnswer, *dm.Answer)
			}

			// Unrelated fields must still pass through untouched.
			if qs.NotNil(dm.Id) {
				qs.Equal(id, *dm.Id)
			}
			if qs.NotNil(dm.Question) {
				qs.Equal(questionText, *dm.Question)
			}
			if qs.NotNil(dm.CountPractise) {
				qs.Equal(countPractise, *dm.CountPractise)
			}
		})
	}
}
