package controllers

import (
	"fmt"
	"net/http"
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"
	"word-flashcard/utils/database"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// QuestionController handles question-related requests
type QuestionController struct {
	questionPeer peers.QuestionPeerInterface
}

// NewQuestionController creates a new QuestionController instance
func NewQuestionController(questionPeer peers.QuestionPeerInterface) *QuestionController {
	return &QuestionController{
		questionPeer: questionPeer,
	}
}

// GetReelQuestionPeer returns the real database peers
func GetReelQuestionPeer() (peers.QuestionPeerInterface, error) {
	questionPeer, err := peers.NewQuestionPeer()
	if err != nil {
		return nil, err
	}

	return questionPeer, nil
}

// ListQuestions @Summary List all questions with pagination
// @Description Get all questions, supports pagination through query parameters
// @Tags Questions
// @Accept json
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Success 200 {array} models.Question "List of Questions retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions [get]
func (qc *QuestionController) ListQuestions(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := parseLimitAndOffsetFromPath(c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Fetch data from database ================
	// Query 'questions' table
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	orderBy2 := fmt.Sprintf("%s ASC", schema.QUESTION_ID)
	questions, err := qc.questionPeer.Select([]*string{}, nil, []*string{&orderBy, &orderBy2}, &limitPtr, &offsetPtr)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	questionEntities := qc.convertToEntities(questions)

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, questionEntities, c)
}

// GetQuestions @Summary Get the question
// @Description Get the question by its ID
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} models.Question "A question retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/{id} [get]
func (qc *QuestionController) GetQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	// Query 'questions' table
	where := squirrel.Eq{schema.COMMON_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	} else if len(questions) != 1 {
		errMsg := fmt.Sprintf("Failed to fetch data from database. %d records match, not equal to 1", len(questions))
		ResponseError(http.StatusInternalServerError, errMsg, nil, c)
		return
	}

	// ================ 3. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)

}

// RandomQuestions @Summary Get random questions
// @Description Randomly obtain the required number of questions
// @Tags Questions
// @Accept json
// @Produce json
// @Param randomFilter body models.QuestionRandomRequest true "Random filter criteria including count and optional filter"
// @Success 200 {array} models.Question "Random questions retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or count parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/random [post]
func (qc *QuestionController) RandomQuestions(c *gin.Context) {
	// ============== 1. Get random filter from request ================
	var randomReq models.QuestionRandomRequest
	err := ParseRequestBody(&randomReq, c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	} else if randomReq.Count <= 0 || randomReq.Count > 1000 {
		ResponseError(http.StatusBadRequest, "Invalid request body - count", nil, c)
		return
	}

	// Convert count to uint64 for database layer
	limitPtr := uint64(randomReq.Count)

	// ================ 2. Fetch data from database ================
	// Use database-agnostic random function pattern
	orderBy := database.TERM_MAPPING_FUNC_RANDOM
	questions, err := qc.questionPeer.Select([]*string{}, nil, []*string{&orderBy}, &limitPtr, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	var questionEntities = []*models.Question{}
	if len(questions) > 0 {
		questionEntities = qc.convertToEntities(questions)
	}

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, questionEntities, c)
}

// CreateQuestions @Summary Create a new question
// @Description Create a new question entry
// @Tags Questions
// @Accept json
// @Produce json
// @Param question body models.Question true "Question data to create"
// @Success 200 {object} models.Question "Question created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/questions [post]
func (qc *QuestionController) CreateQuestions(c *gin.Context) {
	// ================ 1. Parse request body ================
	var questionData models.Question
	err := ParseRequestBody(&questionData, c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, false); err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()

	// ================ 3. Insert data into database ================
	questionID, err := qc.questionPeer.Insert(questionModel)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to insert data into database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", err, c)
		return
	}

	// ================ 5. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 6. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)
}

// UpdateQuestions @Summary Update a question
// @Description Update an existing question's properties like familiarity level
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Param question body models.Question true "Question data to update"
// @Success 200 {object} models.Question "Question updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID or request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/questions/{id} [put]
func (qc *QuestionController) UpdateQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", err, c)
		return
	}

	var questionData models.Question
	err = ParseRequestBody(&questionData, c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, true); err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()
	questionModel.Id = nil // To prevent updating the ID field

	// ================ 3. Update data in database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	if effected, err := qc.questionPeer.Update(questionModel, where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to update data in database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	whereQuery := squirrel.Eq{schema.QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_UPDATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, whereQuery, []*string{&orderBy}, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", err, c)
		return
	}

	// ================ 5. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 6. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)
}

// DeleteQuestions @Summary Delete a question
// @Description Delete a specific question
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 204 "Question deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/questions/definition/{id} [delete]
func (qc *QuestionController) DeleteQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	if effected, err := qc.questionPeer.Delete(where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to delete data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusNoContent, nil, c)
}
