package models

// HealthResponse represents the status response structure
type HealthResponse struct {
	Status string `json:"status"`
}

// InformationResponse represents the application information response
type InformationResponse struct {
	Version string `json:"version"`
}
