package models

// ErrorResponse represents a standard error response structure for all APIs
type ErrorResponse struct {
	Error string `json:"error"`
}
