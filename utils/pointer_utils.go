package utils

// IntPtr returns a pointer to the given int
func IntPtr(i int) *int {
	return &i
}

// StrPtr returns a pointer to the given string
func StrPtr(s string) *string {
	return &s
}

// Float64Ptr returns a pointer to the given float64
func Float64Ptr(f float64) *float64 {
	return &f
}
