package utils

import "strings"

// CleanJSONString removes escape characters from a JSON string
func CleanJSONString(jsonStr string) string {
	return strings.ReplaceAll(jsonStr, "\\\"", "\"")
}
