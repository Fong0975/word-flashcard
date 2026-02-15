package models

// ErrorResponse represents a standard error response structure for all APIs
type ErrorResponse struct {
	Error string `json:"error"`
}

type SearchFilter struct {
	Key      string `json:"key" binding:"required"`
	Operator string `json:"operator" binding:"required"`
	Value    string `json:"value" binding:"required"`
}

func (s SearchFilter) IsEmpty() bool {
	return s.Key == "" && s.Operator == "" && s.Value == ""
}
