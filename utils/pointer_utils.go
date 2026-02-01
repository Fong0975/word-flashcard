package utils

// IntPtr returns a pointer to the given int
func IntPtr(i int) *int {
	return &i
}

// StrPtr returns a pointer to the given string
func StrPtr(s string) *string {
	return &s
}
