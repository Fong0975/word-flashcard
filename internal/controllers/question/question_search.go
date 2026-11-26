package question

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// SearchQuestions @Summary Search questions with filters and pagination
// @Description Search questions using filter criteria with pagination and multi-column sorting. An empty body returns all questions.
// @Description Allowed condition keys: question, option_a, option_b, option_c, option_d, reminder.
// @Tags questions
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter false "Search filter criteria"
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Format: col,-col,(expr),-(expr). Allowed: id,question,answer,count_practise,count_failure_practise,created_at,updated_at"
// @Success 200 {array} models.Question "Questions found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body, filter, or query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/search [post]
func (qc *Controller) SearchQuestions(c *gin.Context) {
	where, ok := parseQuestionSearchFilter(c)
	if !ok {
		return
	}

	qc.respondQuestionList(c, where)
}

// parseQuestionSearchFilter reads a SearchFilter from the request body and converts
// it to a SQL condition restricted to the searchable question columns.
// An empty body yields a nil condition. On invalid input it writes a 400 response
// and returns false.
func parseQuestionSearchFilter(c *gin.Context) (squirrel.Sqlizer, bool) {
	var searchReq models.SearchFilter
	if err := common.ParseRequestBody(&searchReq, c); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return nil, false
	}

	if err := searchReq.ValidateKeys(questionSearchableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid search filter", models.ErrCodeInvalidRequest, err, c)
		return nil, false
	}

	where, err := searchReq.ToSqlizer()
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid search filter", models.ErrCodeInvalidRequest, err, c)
		return nil, false
	}

	return where, true
}
