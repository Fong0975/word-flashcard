package utils

import (
	"github.com/stretchr/testify/suite"
	"testing"
)

// PointerUtilsTestSuite contains all pointer utility related tests
type PointerUtilsTestSuite struct {
	suite.Suite
}

// TestPointerUtilsTestSuite runs all pointer utility tests using the test suite
func TestPointerUtilsTestSuite(t *testing.T) {
	suite.Run(t, new(PointerUtilsTestSuite))
}

// TestIntPtr tests the IntPtr utility function
func (ps *PointerUtilsTestSuite) TestIntPtr() {
	testCases := []struct {
		name     string
		input    int
		expected int
	}{
		{
			name:     "positive integer",
			input:    42,
			expected: 42,
		},
		{
			name:     "negative integer",
			input:    -10,
			expected: -10,
		},
		{
			name:     "zero",
			input:    0,
			expected: 0,
		},
		{
			name:     "large integer",
			input:    999999,
			expected: 999999,
		},
	}

	for _, tc := range testCases {
		ps.Run(tc.name, func() {
			result := IntPtr(tc.input)
			ps.NotNil(result, "IntPtr should return a non-nil pointer")
			ps.Equal(tc.expected, *result, "dereferenced value should match input")
		})
	}
}

// TestStrPtr tests the StrPtr utility function
func (ps *PointerUtilsTestSuite) TestStrPtr() {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "regular string",
			input:    "hello world",
			expected: "hello world",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "string with special characters",
			input:    "Hello, 世界! @#$%",
			expected: "Hello, 世界! @#$%",
		},
		{
			name:     "multiline string",
			input:    "line1\nline2\nline3",
			expected: "line1\nline2\nline3",
		},
	}

	for _, tc := range testCases {
		ps.Run(tc.name, func() {
			result := StrPtr(tc.input)
			ps.NotNil(result, "StrPtr should return a non-nil pointer")
			ps.Equal(tc.expected, *result, "dereferenced value should match input")
		})
	}
}
