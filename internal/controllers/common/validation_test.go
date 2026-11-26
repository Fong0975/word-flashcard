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
		{
			name:     "multi-byte characters at max length are valid",
			field:    ptr(strings.Repeat("中", 10)),
			isUpdate: false,
			length:   10,
			nullable: true,
			wantErr:  false,
		},
		{
			name:     "four-byte characters at max length are valid",
			field:    ptr(strings.Repeat("😀", 10)),
			isUpdate: false,
			length:   10,
			nullable: true,
			wantErr:  false,
		},
		{
			name:       "multi-byte characters over max length report the character count",
			field:      ptr(strings.Repeat("中", 11)),
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

			suite.assertFieldError(err, tc.wantErrMsg, tc.wantDetail)
		})
	}
}

// TestValidateTextField tests ValidateTextField's required/nullable rule and
// its byte-based length limit.
func (suite *ValidationTestSuite) TestValidateTextField() {
	testCases := []struct {
		name       string
		field      *string
		isUpdate   bool
		nullable   bool
		wantErr    bool
		wantDetail []any
	}{
		{
			name:       "non-nullable create with nil field is required",
			field:      nil,
			wantErr:    true,
			wantDetail: []any{"reason", "required field missing"},
		},
		{
			name:     "non-nullable update with nil field skips required check",
			field:    nil,
			isUpdate: true,
		},
		{
			name:     "nullable create with nil field is valid",
			field:    nil,
			nullable: true,
		},
		{
			name:     "single-byte characters at the byte limit are valid",
			field:    ptr(strings.Repeat("a", MaxTextBytes)),
			nullable: true,
		},
		{
			name:     "multi-byte characters at the byte limit are valid",
			field:    ptr(strings.Repeat("中", MaxTextBytes/3)),
			nullable: true,
		},
		{
			name:       "single-byte characters over the byte limit are invalid",
			field:      ptr(strings.Repeat("a", MaxTextBytes+1)),
			nullable:   true,
			wantErr:    true,
			wantDetail: []any{"reason", "exceeds max length", "length", MaxTextBytes + 1, "max", MaxTextBytes},
		},
		{
			name:       "four-byte characters are measured in bytes",
			field:      ptr(strings.Repeat("😀", 16384)),
			nullable:   true,
			wantErr:    true,
			wantDetail: []any{"reason", "exceeds max length", "length", 65536, "max", MaxTextBytes},
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			err := ValidateTextField(tc.field, tc.isUpdate, "field", tc.nullable)

			if !tc.wantErr {
				suite.NoError(err)
				return
			}

			suite.assertFieldError(err, "field is invalid", tc.wantDetail)
		})
	}
}

// assertFieldError verifies both the client-safe message and the diagnostic
// detail carried by a field-validation error.
func (suite *ValidationTestSuite) assertFieldError(err error, wantMsg string, wantDetail []any) {
	suite.Require().Error(err)
	suite.Equal(wantMsg, err.Error())

	var de *DetailedError
	suite.Require().True(errors.As(err, &de), "expected a *DetailedError to carry log detail")
	suite.Equal(wantDetail, de.LogDetail())
}

// ptr returns a pointer to the given string, for building test-case literals.
func ptr(s string) *string { return &s }
