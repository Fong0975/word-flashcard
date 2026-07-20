package question

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// UpdateQuestions @Summary Update a question
// @Description Update an existing question's properties like familiarity level
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Param question body models.Question true "Question data to update"
// @Success 200 {object} models.Question "Question updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID or request body"
// @Failure 404 {object} models.ErrorResponse "Not found - Question not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/questions/{id} [put]
func (qc *Controller) UpdateQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get question ID from URL parameter
	questionID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var questionData models.Question
	err = common.ParseRequestBody(&questionData, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, true); err != nil {
		common.ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()
	questionModel.Id = nil // To prevent updating the ID field

	// ================ 3. Conditionally stamp last_answered_at ================
	if questionData.Practiced {
		now := time.Now().UTC()
		questionModel.LastAnsweredAt = &now
	}

	// ================ 4. Update data in database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	effected, err := qc.questionPeer.Update(questionModel, where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to update data in database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 5. Log the answered option, if the quiz reported one ================
	// selected_option always refers to the question's own option_a-d ordering,
	// not the shuffled order the quiz displayed it in.
	// Best-effort: the question's own update already succeeded above, so a
	// logging failure here must not turn into a user-facing error for an
	// update that already committed.
	if questionData.SelectedOption != nil {
		selectedOption := strings.ToUpper(*questionData.SelectedOption)
		isCorrect := questionModel.Answer != nil && selectedOption == *questionModel.Answer
		answerLog := &dbModels.QuestionAnswerLog{
			QuestionId:     &questionID,
			SelectedOption: &selectedOption,
			IsCorrect:      &isCorrect,
		}
		if _, err := qc.questionAnswerLogPeer.Insert(answerLog); err != nil {
			slog.Error("Failed to log question answer", "question_id", questionID, "error", err)
		}
	}

	// ================ 6. Query inserted data ================
	whereQuery := squirrel.Eq{schema.QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_UPDATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, whereQuery, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 7. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 8. Send response ================
	common.ResponseSuccess(http.StatusOK, questionEntity, c)
}
