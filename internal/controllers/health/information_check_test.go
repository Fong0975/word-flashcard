package health

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"

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

// TestInformationCheckVersionFileNotFound tests that a 500 is returned when no
// VERSION file exists in the working directory or any parent directory.
func (suite *ControllerTestSuite) TestInformationCheckVersionFileNotFound() {
	origWD, err := os.Getwd()
	suite.Require().NoError(err)
	defer func() {
		suite.Require().NoError(os.Chdir(origWD))
	}()

	suite.Require().NoError(os.Chdir(suite.T().TempDir()))

	req := httptest.NewRequest("GET", "/api/information", nil)
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)

	suite.Equal(http.StatusInternalServerError, recorder.Code)
}

// TestInformationCheckVersionFileUnreadable tests that a 500 is returned when
// the VERSION path exists but cannot be read as a file (e.g. it's a directory).
func (suite *ControllerTestSuite) TestInformationCheckVersionFileUnreadable() {
	origWD, err := os.Getwd()
	suite.Require().NoError(err)
	defer func() {
		suite.Require().NoError(os.Chdir(origWD))
	}()

	tempDir := suite.T().TempDir()
	suite.Require().NoError(os.Mkdir(filepath.Join(tempDir, "VERSION"), 0755))
	suite.Require().NoError(os.Chdir(tempDir))

	req := httptest.NewRequest("GET", "/api/information", nil)
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)

	suite.Equal(http.StatusInternalServerError, recorder.Code)
}
