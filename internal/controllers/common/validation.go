package common

import "unicode/utf8"

// MaxTextBytes is the capacity of a MySQL TEXT column. Unlike VARCHAR, whose
// limit counts characters, TEXT is limited by the encoded size in bytes.
const MaxTextBytes = 65535

// ValidateStringField validates a VARCHAR-backed string field against a
// required/nullable rule and a maximum length in characters, returning a
// client-safe field-validation error (see NewFieldError) that also carries the
// concrete reason for diagnostics.
func ValidateStringField(field *string, isUpdate bool, name string, length int, nullable bool) error {
	if err := validateRequiredField(field, isUpdate, name, nullable); err != nil {
		return err
	} else if field == nil {
		return nil
	}

	return validateMaxLength(name, utf8.RuneCountInString(*field), length)
}

// ValidateTextField validates a TEXT-backed string field against a
// required/nullable rule and the MaxTextBytes limit, returning the same kind of
// error as ValidateStringField.
func ValidateTextField(field *string, isUpdate bool, name string, nullable bool) error {
	if err := validateRequiredField(field, isUpdate, name, nullable); err != nil {
		return err
	} else if field == nil {
		return nil
	}

	return validateMaxLength(name, len(*field), MaxTextBytes)
}

// validateRequiredField rejects a missing or empty non-nullable field on
// creation. Updates may omit any field.
func validateRequiredField(field *string, isUpdate bool, name string, nullable bool) error {
	if !nullable && !isUpdate && (field == nil || *field == "") {
		return NewFieldError(name+" is invalid", "reason", "required field missing")
	}

	return nil
}

// validateMaxLength rejects a measured length above the limit. The caller
// chooses the unit (characters or bytes).
func validateMaxLength(name string, length int, limit int) error {
	if length > limit {
		return NewFieldError(name+" is invalid", "reason", "exceeds max length", "length", length, "max", limit)
	}

	return nil
}
