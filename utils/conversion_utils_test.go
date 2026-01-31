package utils

import (
	"github.com/stretchr/testify/suite"
	"testing"
)

// ConversionUtilsTestSuite contains all conversion utility related tests
type ConversionUtilsTestSuite struct {
	suite.Suite
}

// TestConversionUtilsTestSuite runs all conversion utility tests using the test suite
func TestConversionUtilsTestSuite(t *testing.T) {
	suite.Run(t, new(ConversionUtilsTestSuite))
}

// TestCleanJSONString tests the CleanJSONString utility function
func (cs *ConversionUtilsTestSuite) TestCleanJSONString() {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "replace escaped quotes",
			input:    `{\"name\":\"Wind\"}`,
			expected: `{"name":"Wind"}`,
		},
		{
			name:     "multiple escaped quotes",
			input:    `{\"a\":\"1\",\"b\":\"2\"}`,
			expected: `{"a":"1","b":"2"}`,
		},
		{
			name:     "no escaped quotes",
			input:    `{"plain":"text"}`,
			expected: `{"plain":"text"}`,
		},
	}

	for _, tc := range testCases {
		cs.Run(tc.name, func() {
			result := CleanJSONString(tc.input)
			cs.Equal(tc.expected, result)
		})
	}
}