package handlers

import "net/http"

// WebHandlerInterface defines the interface for web handler
type WebHandlerInterface interface {
	IndexHandler(w http.ResponseWriter, r *http.Request)
}
