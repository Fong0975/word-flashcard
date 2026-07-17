package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/models"
)

// TestHealthCheckSuccess tests that the health check endpoint responds with 200 OK and correct data
func (suite *ControllerTestSuite) TestHealthCheckSuccess() {
	// Create a test request to the health endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	recorder := httptest.NewRecorder()

	// Execute the request through the gin router
	suite.router.ServeHTTP(recorder, req)

	// Verify that the endpoint responds with 200 OK
	suite.Equal(http.StatusOK, recorder.Code, "Health endpoint should respond with 200 OK")

	// Verify the response contains valid JSON with correct structure
	var response models.HealthResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Response should be valid JSON")

	// Verify the status field value
	suite.Equal("OK", response.Status, "Health status should be 'OK'")

	// Verify content type header
	suite.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}
