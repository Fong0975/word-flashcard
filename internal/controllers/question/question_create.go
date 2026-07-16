package question

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// CreateQuestions @Summary Create a new question
// @Description Create a new question entry
// @Tags questions
// @Accept json
// @Produce json
// @Param question body models.Question true "Question data to create"
// @Success 200 {object} models.Question "Question created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/questions [post]
func (qc *Controller) CreateQuestions(c *gin.Context) {
	// ================ 1. Parse request body ================
	var questionData models.Question
	err := common.ParseRequestBody(&questionData, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, false); err != nil {
		common.ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()

	// ================ 3. Insert data into database ================
	questionID, err := qc.questionPeer.Insert(questionModel)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to insert data into database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 5. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 6. Send response ================
	common.ResponseSuccess(http.StatusOK, questionEntity, c)
}
