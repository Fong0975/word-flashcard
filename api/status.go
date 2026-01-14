package api

import (
	"encoding/json"
	"net/http"
)

// StatusResponse represents the status response structure
type StatusResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// StatusHandler handles status requests
func StatusHandler(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*") // Allow CORS

	// Create response data
	response := StatusResponse{
		Status:  "OK",
		Message: "Hello World! Service is running normally",
	}

	// Encode response as JSON
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
