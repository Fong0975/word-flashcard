package common

import (
	"errors"
	"strings"
	"testing"

	"github.com/stretchr/testify/suite"
)

// ValidationTestSuite is a test suite for generic field-validation helpers
type ValidationTestSuite struct {
	suite.Suite
}

// TestValidationTestSuite runs the ValidationTestSuite
func TestValidationTestSuite(t *testing.T) {
	suite.Run(t, new(ValidationTestSuite))
}

// TestValidateStringField tests ValidateStringField across the required/nullable
// combinations and the max-length check, verifying both the client-safe message
// and the diagnostic detail carried by the returned *DetailedError.
func (suite *ValidationTestSuite) TestValidateStringField() {
	value := "example"
	tooLong := strings.Repeat("a", 11)

	testCases := []struct {
		name       string
		field      *string
		isUpdate   bool
		length     int
		nullable   bool
		wantErr    bool
		wantErrMsg string
		wantDetail []any
	}{
		{
			name:     "non-nullable create with value is valid",
			field:    &value,
			isUpdate: false,
			length:   10,
			nullable: false,
			wantErr:  false,
		},
		{
			name:       "non-nullable create with nil field is required",
			field:      nil,
			isUpdate:   false,
			length:     10,
			nullable:   false,
			wantErr:    true,
			wantErrMsg: "field is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name:       "non-nullable create with empty string is required",
			field:      ptr(""),
			isUpdate:   false,
			length:     10,
			nullable:   false,
			wantErr:    true,
			wantErrMsg: "field is invalid",
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name:     "non-nullable update with nil field skips required check",
			field:    nil,
			isUpdate: true,
			length:   10,
			nullable: false,
			wantErr:  false,
		},
		{
			name:     "nullable create with nil field is valid",
			field:    nil,
			isUpdate: false,
			length:   10,
			nullable: true,
			wantErr:  false,
		},
		{
			name:       "field exceeding max length is invalid",
			field:      &tooLong,
			isUpdate:   false,
			length:     10,
			nullable:   true,
			wantErr:    true,
			wantErrMsg: "field is invalid",
			wantDetail: []any{"reason", "exceeds max length", "length", 11, "max", 10},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := ValidateStringField(tc.field, tc.isUpdate, "field", tc.length, tc.nullable)

			if !tc.wantErr {
				suite.NoError(err)
				return
			}

			suite.Error(err)
			suite.Equal(tc.wantErrMsg, err.Error())

			var de *DetailedError
			suite.Require().True(errors.As(err, &de), "expected a *DetailedError to carry log detail")
			suite.Equal(tc.wantDetail, de.LogDetail())
		})
	}
}

// ptr returns a pointer to the given string, for building test-case literals.
func ptr(s string) *string { return &s }
