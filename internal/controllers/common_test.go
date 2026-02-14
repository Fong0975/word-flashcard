package controllers

import (
	"testing"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// CommonTestSuite is a test suite for common functions
type CommonTestSuite struct {
	suite.Suite
}

// TestCommonTestSuite runs the CommonTestSuite
func TestCommonTestSuite(t *testing.T) {
	suite.Run(t, new(CommonTestSuite))
}

// TestConvertFilterToSqlizer tests the ConvertFilterToSqlizer function with four operators
func (suite *CommonTestSuite) TestConvertFilterToSqlizer() {
	testCases := []struct {
		name     string
		filter   *models.SearchFilter
		expected squirrel.Sqlizer
	}{
		{
			name: "eq operator",
			filter: &models.SearchFilter{
				Key:      "familiarity",
				Operator: "eq",
				Value:    "high",
			},
			expected: squirrel.Eq{"familiarity": "high"},
		},
		{
			name: "neq operator",
			filter: &models.SearchFilter{
				Key:      "familiarity",
				Operator: "neq",
				Value:    "low",
			},
			expected: squirrel.NotEq{"familiarity": "low"},
		},
		{
			name: "in operator",
			filter: &models.SearchFilter{
				Key:      "familiarity",
				Operator: "in",
				Value:    "[\"high\", \"medium\"]",
			},
			expected: squirrel.Eq{"familiarity": []interface{}{"high", "medium"}},
		},
		{
			name: "nin operator",
			filter: &models.SearchFilter{
				Key:      "familiarity",
				Operator: "nin",
				Value:    "[\"low\", \"unknown\"]",
			},
			expected: squirrel.NotEq{"familiarity": []interface{}{"low", "unknown"}},
		},
		{
			name: "like operator",
			filter: &models.SearchFilter{
				Key:      "word",
				Operator: "like",
				Value:    "%test%",
			},
			expected: squirrel.Like{"word": "%test%"},
		},
		{
			name: "not_like operator",
			filter: &models.SearchFilter{
				Key:      "word",
				Operator: "not_like",
				Value:    "%temp%",
			},
			expected: squirrel.NotLike{"word": "%temp%"},
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result, err := ConvertFilterToSqlizer(tc.filter)

			// Verify no error
			assert.NoError(t, err)
			// Verify the result matches expected
			assert.Equal(t, tc.expected, result)
		})
	}
}

// TestParseArrayFilter tests the parseArrayFilter function with normal calls
func (suite *CommonTestSuite) TestParseArrayFilter() {
	// Test in operation (isNotIn = false)
	key := "familiarity"
	value := "[\"high\", \"medium\"]"
	isNotIn := false

	result, err := parseArrayFilter(key, value, isNotIn)

	// Verify no error
	assert.NoError(suite.T(), err)
	// Verify the result is squirrel.Eq type with correct key-value array
	expectedEq := squirrel.Eq{"familiarity": []interface{}{"high", "medium"}}
	assert.Equal(suite.T(), expectedEq, result)
}