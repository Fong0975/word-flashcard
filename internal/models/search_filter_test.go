package models

import (
	"testing"

	"github.com/Masterminds/squirrel"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// SearchFilterTestSuite contains all SearchFilter related tests
type SearchFilterTestSuite struct {
	suite.Suite
}

// TestSearchFilterTestSuite runs all SearchFilter tests using the test suite
func TestSearchFilterTestSuite(t *testing.T) {
	suite.Run(t, new(SearchFilterTestSuite))
}

// Helper method to create SearchCondition
func (suite *SearchFilterTestSuite) createCondition(key, operator, value string) SearchCondition {
	return SearchCondition{
		Key:      key,
		Operator: operator,
		Value:    value,
	}
}

// Helper method to create SearchFilter
func (suite *SearchFilterTestSuite) createFilter(logic string, conditions ...SearchCondition) SearchFilter {
	return SearchFilter{
		Conditions: conditions,
		Logic:      logic,
	}
}

// TestIsEmpty tests the IsEmpty method
func (suite *SearchFilterTestSuite) TestIsEmpty() {
	testCases := []struct {
		name     string
		filter   SearchFilter
		expected bool
	}{
		{
			name:     "empty filter with no conditions",
			filter:   SearchFilter{},
			expected: true,
		},
		{
			name:     "filter with empty conditions slice",
			filter:   SearchFilter{Conditions: []SearchCondition{}},
			expected: true,
		},
		{
			name: "filter with one condition",
			filter: suite.createFilter("AND",
				suite.createCondition("familiarity", "eq", "high"),
			),
			expected: false,
		},
		{
			name: "filter with multiple conditions",
			filter: suite.createFilter("OR",
				suite.createCondition("familiarity", "eq", "high"),
				suite.createCondition("color", "ne", "red"),
			),
			expected: false,
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result := tc.filter.IsEmpty()
			assert.Equal(t, tc.expected, result)
		})
	}
}

// TestToSqlizer tests the ToSqlizer method
func (suite *SearchFilterTestSuite) TestToSqlizer() {
	testCases := []struct {
		name        string
		filter      SearchFilter
		expected    squirrel.Sqlizer
		expectError bool
		errorMsg    string
	}{
		{
			name:        "empty filter returns nil",
			filter:      SearchFilter{},
			expected:    nil,
			expectError: false,
		},
		{
			name: "single condition with AND logic",
			filter: suite.createFilter("AND",
				suite.createCondition("familiarity", "eq", "high"),
			),
			expected:    squirrel.Eq{"familiarity": "high"},
			expectError: false,
		},
		{
			name: "multiple conditions with AND logic",
			filter: suite.createFilter("AND",
				suite.createCondition("familiarity", "eq", "high"),
				suite.createCondition("color", "ne", "red"),
			),
			expected: squirrel.And([]squirrel.Sqlizer{
				squirrel.Eq{"familiarity": "high"},
				squirrel.NotEq{"color": "red"},
			}),
			expectError: false,
		},
		{
			name: "multiple conditions with OR logic",
			filter: suite.createFilter("OR",
				suite.createCondition("familiarity", "eq", "high"),
				suite.createCondition("color", "like", "%blue%"),
			),
			expected: squirrel.Or([]squirrel.Sqlizer{
				squirrel.Eq{"familiarity": "high"},
				squirrel.Like{"color": "%blue%"},
			}),
			expectError: false,
		},
		{
			name: "case insensitive logic operator - lowercase",
			filter: suite.createFilter("and",
				suite.createCondition("size", "eq", "large"),
			),
			expected:    squirrel.Eq{"size": "large"},
			expectError: false,
		},
		{
			name: "case insensitive logic operator - mixed case",
			filter: suite.createFilter("Or",
				suite.createCondition("type", "eq", "book"),
			),
			expected:    squirrel.Eq{"type": "book"},
			expectError: false,
		},
		{
			name: "invalid logic operator",
			filter: suite.createFilter("XOR",
				suite.createCondition("status", "eq", "active"),
			),
			expected:    nil,
			expectError: true,
			errorMsg:    "logic operator must be 'AND' or 'OR'",
		},
		{
			name: "condition with invalid operator",
			filter: suite.createFilter("AND",
				suite.createCondition("status", "invalid_op", "active"),
			),
			expected:    nil,
			expectError: true,
			errorMsg:    "condition 1:",
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result, err := tc.filter.ToSqlizer()

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}

// TestConvertConditionToSqlizer tests the convertConditionToSqlizer function
func (suite *SearchFilterTestSuite) TestConvertConditionToSqlizer() {
	testCases := []struct {
		name        string
		condition   *SearchCondition
		expected    squirrel.Sqlizer
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil condition",
			condition:   nil,
			expected:    nil,
			expectError: false,
		},
		{
			name: "equal operator",
			condition: &SearchCondition{
				Key:      "familiarity",
				Operator: "eq",
				Value:    "high",
			},
			expected:    squirrel.Eq{"familiarity": "high"},
			expectError: false,
		},
		{
			name: "not equal operator",
			condition: &SearchCondition{
				Key:      "color",
				Operator: "neq",
				Value:    "red",
			},
			expected:    squirrel.NotEq{"color": "red"},
			expectError: false,
		},
		{
			name: "in operator",
			condition: &SearchCondition{
				Key:      "size",
				Operator: "in",
				Value:    "[\"large\", \"medium\"]",
			},
			expected:    squirrel.Eq{"size": []interface{}{"large", "medium"}},
			expectError: false,
		},
		{
			name: "not_in operator",
			condition: &SearchCondition{
				Key:      "status",
				Operator: "nin",
				Value:    "[\"inactive\", \"deleted\"]",
			},
			expected:    squirrel.NotEq{"status": []interface{}{"inactive", "deleted"}},
			expectError: false,
		},
		{
			name: "like operator",
			condition: &SearchCondition{
				Key:      "word",
				Operator: "like",
				Value:    "%test%",
			},
			expected:    squirrel.Like{"word": "%test%"},
			expectError: false,
		},
		{
			name: "not_like operator",
			condition: &SearchCondition{
				Key:      "description",
				Operator: "nlike",
				Value:    "%temp%",
			},
			expected:    squirrel.NotLike{"description": "%temp%"},
			expectError: false,
		},
		{
			name: "empty key",
			condition: &SearchCondition{
				Key:      "",
				Operator: "eq",
				Value:    "value",
			},
			expected:    nil,
			expectError: true,
			errorMsg:    "condition key cannot be empty",
		},
		{
			name: "empty operator",
			condition: &SearchCondition{
				Key:      "field",
				Operator: "",
				Value:    "value",
			},
			expected:    nil,
			expectError: true,
			errorMsg:    "condition operator cannot be empty",
		},
		{
			name: "empty value for equal",
			condition: &SearchCondition{
				Key:      "field",
				Operator: "eq",
				Value:    "",
			},
			expected:    nil,
			expectError: true,
			errorMsg:    "condition value cannot be empty for equal operation",
		},
		{
			name: "unsupported operator",
			condition: &SearchCondition{
				Key:      "field",
				Operator: "regex",
				Value:    "pattern",
			},
			expected:    nil,
			expectError: true,
			errorMsg:    "unsupported operator: regex",
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result, err := convertConditionToSqlizer(tc.condition)

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}

// TestParseArrayCondition tests the parseArrayCondition function
func (suite *SearchFilterTestSuite) TestParseArrayCondition() {
	testCases := []struct {
		name        string
		key         string
		value       string
		isNotIn     bool
		expected    squirrel.Sqlizer
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid array for in operation",
			key:         "colors",
			value:       "[\"red\", \"blue\", \"green\"]",
			isNotIn:     false,
			expected:    squirrel.Eq{"colors": []interface{}{"red", "blue", "green"}},
			expectError: false,
		},
		{
			name:        "valid array for not_in operation",
			key:         "status",
			value:       "[\"inactive\", \"deleted\"]",
			isNotIn:     true,
			expected:    squirrel.NotEq{"status": []interface{}{"inactive", "deleted"}},
			expectError: false,
		},
		{
			name:        "single element array",
			key:         "type",
			value:       "[\"premium\"]",
			isNotIn:     false,
			expected:    squirrel.Eq{"type": []interface{}{"premium"}},
			expectError: false,
		},
		{
			name:        "numeric array",
			key:         "scores",
			value:       "[85, 90, 95]",
			isNotIn:     false,
			expected:    squirrel.Eq{"scores": []interface{}{85.0, 90.0, 95.0}}, // JSON unmarshaling converts numbers to float64
			expectError: false,
		},
		{
			name:        "mixed type array",
			key:         "mixed",
			value:       "[\"text\", 42, true]",
			isNotIn:     false,
			expected:    squirrel.Eq{"mixed": []interface{}{"text", 42.0, true}},
			expectError: false,
		},
		{
			name:        "empty value",
			key:         "field",
			value:       "",
			isNotIn:     false,
			expected:    nil,
			expectError: true,
			errorMsg:    "condition value cannot be empty for array operations",
		},
		{
			name:        "invalid JSON",
			key:         "field",
			value:       "[\"unclosed",
			isNotIn:     false,
			expected:    nil,
			expectError: true,
			errorMsg:    "condition value must be a valid JSON array",
		},
		{
			name:        "not an array",
			key:         "field",
			value:       "\"single_string\"",
			isNotIn:     false,
			expected:    nil,
			expectError: true,
			errorMsg:    "condition value must be a valid JSON array",
		},
		{
			name:        "empty array",
			key:         "field",
			value:       "[]",
			isNotIn:     false,
			expected:    nil,
			expectError: true,
			errorMsg:    "condition value array cannot be empty for array operations",
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result, err := parseArrayCondition(tc.key, tc.value, tc.isNotIn)

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}
