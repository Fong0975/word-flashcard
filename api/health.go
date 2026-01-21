package api

import "net/http"

// HealthResponse represents the status response structure
type HealthResponse struct {
	Status string `json:"status"`
}

func (h *HealthHandler) Register(mux *http.ServeMux) {
	RegisterAPIMethod(mux, METHOD_GET, "health", h.healthCheck)
}

// healthCheck handles health check requests
// @Summary Health check endpoint
// @Description Returns server status to verify the service is running
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse "Server is healthy"
// @Router /api/health [get]
func (h *HealthHandler) healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// HealthHandler API module - health check
type HealthHandler struct{}
