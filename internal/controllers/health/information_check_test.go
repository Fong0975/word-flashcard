package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"word-flashcard/internal/models"
)

// TestInformationCheckSuccess tests that the information endpoint responds with 200 OK and a non-empty version
func (suite *ControllerTestSuite) TestInformationCheckSuccess() {
	req := httptest.NewRequest("GET", "/api/information", nil)
	recorder := httptest.NewRecorder()

	suite.router.ServeHTTP(recorder, req)

	suite.Equal(http.StatusOK, recorder.Code, "Information endpoint should respond with 200 OK")

	var response models.InformationResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err, "Response should be valid JSON")

	suite.NotEmpty(response.Version, "Version should not be empty")
	suite.Equal("application/json; charset=utf-8", recorder.Header().Get("Content-Type"), "Content-Type should be application/json")
}
