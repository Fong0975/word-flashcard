package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// SortParamTestSuite contains all SortParam related tests
type SortParamTestSuite struct {
	suite.Suite
}

// TestSortParamTestSuite runs all SortParam tests using the test suite
func TestSortParamTestSuite(t *testing.T) {
	suite.Run(t, new(SortParamTestSuite))
}

// TestParseSortParam tests the ParseSortParam function
func (suite *SortParamTestSuite) TestParseSortParam() {
	testCases := []struct {
		name        string
		input       string
		expectError bool
		errorMsg    string
		itemCount   int
		items       []sortItem
	}{
		{
			name:        "empty string returns empty SortParam",
			input:       "",
			expectError: false,
			itemCount:   0,
		},
		{
			name:        "single plain column ASC",
			input:       "id",
			expectError: false,
			itemCount:   1,
			items:       []sortItem{{raw: "id", isExpr: false, desc: false}},
		},
		{
			name:        "single plain column DESC",
			input:       "-created_at",
			expectError: false,
			itemCount:   1,
			items:       []sortItem{{raw: "created_at", isExpr: false, desc: true}},
		},
		{
			name:        "multiple plain columns",
			input:       "-created_at,id",
			expectError: false,
			itemCount:   2,
			items: []sortItem{
				{raw: "created_at", isExpr: false, desc: true},
				{raw: "id", isExpr: false, desc: false},
			},
		},
		{
			name:        "single expression ASC",
			input:       "(count_practise*2)",
			expectError: false,
			itemCount:   1,
			items:       []sortItem{{raw: "count_practise*2", isExpr: true, desc: false}},
		},
		{
			name:        "single expression DESC",
			input:       "-(count_failure_practise/count_practise)",
			expectError: false,
			itemCount:   1,
			items:       []sortItem{{raw: "count_failure_practise/count_practise", isExpr: true, desc: true}},
		},
		{
			name:        "mixed plain and expression",
			input:       "-created_at,(count_practise*2),-(count_failure_practise/count_practise)",
			expectError: false,
			itemCount:   3,
			items: []sortItem{
				{raw: "created_at", isExpr: false, desc: true},
				{raw: "count_practise*2", isExpr: true, desc: false},
				{raw: "count_failure_practise/count_practise", isExpr: true, desc: true},
			},
		},
		{
			name:        "empty entry from double comma",
			input:       "id,,created_at",
			expectError: true,
			errorMsg:    "empty entry",
		},
		{
			name:        "empty entry after dash",
			input:       "-",
			expectError: true,
			errorMsg:    "empty entry after '-'",
		},
		{
			name:        "expression missing closing parenthesis",
			input:       "(count_practise",
			expectError: true,
			errorMsg:    "missing closing parenthesis",
		},
		{
			name:        "empty expression body",
			input:       "()",
			expectError: true,
			errorMsg:    "sort expression cannot be empty",
		},
		{
			name:        "empty expression body with DESC",
			input:       "-()",
			expectError: true,
			errorMsg:    "sort expression cannot be empty",
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			result, err := ParseSortParam(tc.input)

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.Len(t, result.items, tc.itemCount)
				if tc.items != nil {
					assert.Equal(t, tc.items, result.items)
				}
			}
		})
	}
}

// TestIsEmpty tests the IsEmpty method
func (suite *SortParamTestSuite) TestIsEmpty() {
	testCases := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "zero-value SortParam",
			input:    "",
			expected: true,
		},
		{
			name:     "single plain column",
			input:    "id",
			expected: false,
		},
		{
			name:     "single expression",
			input:    "(count_practise*2)",
			expected: false,
		},
		{
			name:     "multiple items",
			input:    "-created_at,id",
			expected: false,
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			param, err := ParseSortParam(tc.input)
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, param.IsEmpty())
		})
	}
}

// TestValidate tests the Validate method
func (suite *SortParamTestSuite) TestValidate() {
	allowedColumns := []string{"id", "created_at", "count_practise", "count_failure_practise"}

	testCases := []struct {
		name        string
		input       string
		expectError bool
		errorMsg    string
	}{
		{
			name:        "empty SortParam is always valid",
			input:       "",
			expectError: false,
		},
		{
			name:        "single allowed plain column",
			input:       "id",
			expectError: false,
		},
		{
			name:        "multiple allowed plain columns",
			input:       "-created_at,id",
			expectError: false,
		},
		{
			name:        "expression with all allowed columns",
			input:       "(count_failure_practise/count_practise)",
			expectError: false,
		},
		{
			name:        "expression DESC with all allowed columns",
			input:       "-(count_failure_practise/count_practise)",
			expectError: false,
		},
		{
			name:        "mixed plain and expression with all allowed columns",
			input:       "-created_at,(count_practise*2)",
			expectError: false,
		},
		{
			name:        "disallowed plain column",
			input:       "invalid_col",
			expectError: true,
			errorMsg:    `"invalid_col"`,
		},
		{
			name:        "expression with disallowed column",
			input:       "(invalid_col/count_practise)",
			expectError: true,
			errorMsg:    `"invalid_col"`,
		},
		{
			name:        "expression where only one column is disallowed",
			input:       "(count_failure_practise/invalid_col)",
			expectError: true,
			errorMsg:    `"invalid_col"`,
		},
		{
			name:        "multiple items with one disallowed plain column",
			input:       "-created_at,invalid_col",
			expectError: true,
			errorMsg:    `"invalid_col"`,
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			param, err := ParseSortParam(tc.input)
			assert.NoError(t, err)

			err = param.Validate(allowedColumns)

			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestToOrderByClauses tests the ToOrderByClauses method
func (suite *SortParamTestSuite) TestToOrderByClauses() {
	strPtr := func(s string) *string { return &s }

	testCases := []struct {
		name     string
		input    string
		expected []*string
	}{
		{
			name:     "empty SortParam returns nil",
			input:    "",
			expected: nil,
		},
		{
			name:     "single plain column ASC",
			input:    "id",
			expected: []*string{strPtr("id ASC")},
		},
		{
			name:     "single plain column DESC",
			input:    "-created_at",
			expected: []*string{strPtr("created_at DESC")},
		},
		{
			name:     "multiple plain columns",
			input:    "-created_at,id",
			expected: []*string{strPtr("created_at DESC"), strPtr("id ASC")},
		},
		{
			name:     "single expression ASC",
			input:    "(count_practise*2)",
			expected: []*string{strPtr("(count_practise*2) ASC")},
		},
		{
			name:     "single expression DESC",
			input:    "-(count_failure_practise/count_practise)",
			expected: []*string{strPtr("(count_failure_practise/count_practise) DESC")},
		},
		{
			name:  "mixed plain and expression",
			input: "-created_at,(count_practise*2),-(count_failure_practise/count_practise)",
			expected: []*string{
				strPtr("created_at DESC"),
				strPtr("(count_practise*2) ASC"),
				strPtr("(count_failure_practise/count_practise) DESC"),
			},
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			param, err := ParseSortParam(tc.input)
			assert.NoError(t, err)

			result := param.ToOrderByClauses()

			if tc.expected == nil {
				assert.Nil(t, result)
			} else {
				assert.Len(t, result, len(tc.expected))
				for i, clause := range result {
					assert.Equal(t, *tc.expected[i], *clause)
				}
			}
		})
	}
}
