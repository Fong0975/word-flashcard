package api

import "net/http"

// HealthResponse represents the status response structure
type HealthResponse struct {
	Status string `json:"status"`
}

func (h *HealthHandler) Register(mux *http.ServeMux) {
	RegisterAPIMethod(mux, METHOD_GET, "health", h.healthCheck)
}

func (h *HealthHandler) healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// HealthHandler API module - health check
type HealthHandler struct{}
