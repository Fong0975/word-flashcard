package common

// ValidateStringField validates a string field against a required/nullable
// rule and a maximum length, returning a client-safe field-validation error
// (see NewFieldError) that also carries the concrete reason for diagnostics.
func ValidateStringField(field *string, isUpdate bool, name string, length int, nullable bool) error {
	if !nullable && !isUpdate && (field == nil || *field == "") {
		return NewFieldError(name+" is invalid", "reason", "required field missing")
	} else if field != nil && len(*field) > length {
		return NewFieldError(name+" is invalid", "reason", "exceeds max length", "length", len(*field), "max", length)
	}

	return nil
}
