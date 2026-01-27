package mocks

import (
	"net/http"
)

// MockWebHandler is a mock implementation for WebHandler
type MockWebHandler struct{}

// NewMockWebHandler creates a new mock web handler instance
func NewMockWebHandler() *MockWebHandler {
	return &MockWebHandler{}
}

// IndexHandler mock implementation
func (m *MockWebHandler) IndexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte(`{"handler":"IndexHandler","controller":"WebHandler"}`))
	if err != nil {
		return
	}
}
