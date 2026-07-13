package controllers

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// questionSortableColumns defines the columns allowed in sort query parameters for the questions table.
var questionSortableColumns = []string{
	schema.QUESTION_ID,
	schema.QUESTION_QUESTION,
	schema.QUESTION_ANSWER,
	schema.QUESTION_COUNT_PRACTISE,
	schema.QUESTION_COUNT_FAILURE_PRACTISE,
	schema.COMMON_CREATED_AT,
	schema.COMMON_UPDATED_AT,
}

// QuestionController handles question-related requests
type QuestionController struct {
	questionPeer          peers.QuestionPeerInterface
	questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface
}

// NewQuestionController creates a new QuestionController instance
func NewQuestionController(questionPeer peers.QuestionPeerInterface, questionAnswerLogPeer peers.QuestionAnswerLogPeerInterface) *QuestionController {
	return &QuestionController{
		questionPeer:          questionPeer,
		questionAnswerLogPeer: questionAnswerLogPeer,
	}
}

// GetReelQuestionPeers returns the real database peers
func GetReelQuestionPeers() (peers.QuestionPeerInterface, peers.QuestionAnswerLogPeerInterface, error) {
	questionPeer, err := peers.NewQuestionPeer()
	if err != nil {
		return nil, nil, err
	}

	questionAnswerLogPeer, err := peers.NewQuestionAnswerLogPeer()
	if err != nil {
		return nil, nil, err
	}

	return questionPeer, questionAnswerLogPeer, nil
}

// ListQuestions @Summary List all questions with pagination
// @Description Get all questions, supports pagination and multi-column sorting through query parameters
// @Tags questions
// @Accept json
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns/expressions, comma-separated. Format: col,-col,(expr),-(expr). Allowed: id,question,answer,count_practise,count_failure_practise,created_at,updated_at"
// @Success 200 {array} models.Question "List of Questions retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions [get]
func (qc *QuestionController) ListQuestions(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := parseLimitAndOffsetFromPath(c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(questionSortableColumns); err != nil {
		ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Build ORDER BY clauses: use provided sort or fall back to default
	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder1 := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
		defaultOrder2 := fmt.Sprintf("%s DESC", schema.QUESTION_ID)
		orderByClauses = []*string{&defaultOrder1, &defaultOrder2}
	}

	// ================ 3. Fetch data from database ================
	questions, err := qc.questionPeer.Select([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Transform data to API model ================
	questionEntities := qc.convertToEntities(questions)

	// ================ 5. Send response ================
	ResponseSuccess(http.StatusOK, questionEntities, c)
}

// GetQuestions @Summary Get the question
// @Description Get the question by its ID
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} models.Question "A question retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 404 {object} models.ErrorResponse "Not found - Question not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/{id} [get]
func (qc *QuestionController) GetQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	// Query 'questions' table
	where := squirrel.Eq{schema.COMMON_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	} else if len(questions) == 0 {
		ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
		return
	} else if len(questions) != 1 {
		errMsg := fmt.Sprintf("Failed to fetch data from database. %d records match, not equal to 1", len(questions))
		ResponseError(http.StatusInternalServerError, errMsg, models.ErrCodeInternalError, nil, c)
		return
	}

	// ================ 3. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)

}

// RandomQuestions @Summary Get random questions
// @Description Randomly obtain the required number of questions
// @Tags questions
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
		ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if randomReq.Count <= 0 || randomReq.Count > 1000 {
		ResponseError(http.StatusBadRequest, "Invalid request body - count", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 2. Fetch data from database ================
	// Use weighted bucket sampling: unpractised (50%) > high-failure-rate (30%) > high-success-rate (20%)
	questions, err := qc.fetchRandomQuestionsWeighted(randomReq.Count, randomReq.ExcludeRecentDays)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
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
// @Tags questions
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
		ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, false); err != nil {
		ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()

	// ================ 3. Insert data into database ================
	questionID, err := qc.questionPeer.Insert(questionModel)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to insert data into database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	questions, err := qc.questionPeer.Select([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 5. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 6. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)
}

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
func (qc *QuestionController) UpdateQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	var questionData models.Question
	err = ParseRequestBody(&questionData, c)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	} else if err := qc.validateQuestionFields(&questionData, true); err != nil {
		ResponseError(http.StatusBadRequest, err.Error(), models.ErrCodeValidationError, err, c)
		return
	}

	// ================ 2. Convert to data model ================
	questionModel := questionData.ToDataModel()
	questionModel.Id = nil // To prevent updating the ID field

	// ================ 3. Conditionally stamp last_answered_at ================
	if questionData.Practiced {
		now := time.Now()
		questionModel.LastAnsweredAt = &now
	}

	// ================ 4. Update data in database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	effected, err := qc.questionPeer.Update(questionModel, where)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to update data in database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
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
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 7. Transform data to API model ================
	questionEntity := new(models.Question).FromDataModel(questions[0])

	// ================ 8. Send response ================
	ResponseSuccess(http.StatusOK, questionEntity, c)
}

// DeleteQuestions @Summary Delete a question
// @Description Delete a specific question
// @Tags questions
// @Accept json
// @Produce json
// @Param id path int true "Question ID"
// @Success 204 "Question deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Question not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/questions/{id} [delete]
func (qc *QuestionController) DeleteQuestions(c *gin.Context) {
	// ================ 1. Parse request parameter ================
	// Get question ID from URL parameter
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.QUESTION_ID: questionID}
	effected, err := qc.questionPeer.Delete(where)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		ResponseError(http.StatusNotFound, "Question not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusNoContent, nil, c)
}

// CountQuestions @Summary Count total questions
// @Description Get the total count of questions in the database
// @Tags questions
// @Accept json
// @Produce json
// @Success 200 {object} map[string]int64 "Total count of questions"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count questions in database"
// @Router /api/questions/count [get]
func (qc *QuestionController) CountQuestions(c *gin.Context) {
	// ================ 1. Fetch data from database ================
	count, err := qc.questionPeer.Count()
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to count questions in database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Send response ================
	ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}

// StatsQuestions @Summary Get question statistics
// @Description Get question count distribution by accuracy rate in 10% intervals, each bucket further broken down by practice count
// @Tags questions
// @Produce json
// @Success 200 {object} models.QuestionStats "Question accuracy distribution"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch questions"
// @Router /api/questions/stats [get]
func (qc *QuestionController) StatsQuestions(c *gin.Context) {
	// ================ 1. Fetch minimal question data for accuracy computation ================
	cpCol := schema.QUESTION_COUNT_PRACTISE
	cfpCol := schema.QUESTION_COUNT_FAILURE_PRACTISE
	questions, err := qc.questionPeer.Select([]*string{&cpCol, &cfpCol}, nil, nil, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch questions", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Bucket questions by accuracy rate (100% → N/A) ================
	buckets := []models.AccuracyBucket{
		{Range: "100%", Count: 0},
		{Range: "91-99%", Count: 0},
		{Range: "81-90%", Count: 0},
		{Range: "71-80%", Count: 0},
		{Range: "61-70%", Count: 0},
		{Range: "51-60%", Count: 0},
		{Range: "41-50%", Count: 0},
		{Range: "31-40%", Count: 0},
		{Range: "21-30%", Count: 0},
		{Range: "11-20%", Count: 0},
		{Range: "1-10%", Count: 0},
		{Range: "0%", Count: 0},
		{Range: "N/A", Count: 0},
	}

	// practiceCounts[i] collects the practice count of every question that
	// fell into buckets[i], so it can be broken down further below.
	practiceCounts := make([][]int, len(buckets))

	for _, q := range questions {
		if q.CountPractise == nil || *q.CountPractise == 0 {
			buckets[12].Count++
			practiceCounts[12] = append(practiceCounts[12], 0)
			continue
		}
		successCount := *q.CountPractise
		if q.CountFailurePractise != nil {
			successCount -= *q.CountFailurePractise
		}
		if successCount < 0 {
			successCount = 0
		}
		accuracy := successCount * 100 / *q.CountPractise

		idx := 11
		switch {
		case accuracy == 100:
			idx = 0
		case accuracy >= 91:
			idx = 1
		case accuracy >= 81:
			idx = 2
		case accuracy >= 71:
			idx = 3
		case accuracy >= 61:
			idx = 4
		case accuracy >= 51:
			idx = 5
		case accuracy >= 41:
			idx = 6
		case accuracy >= 31:
			idx = 7
		case accuracy >= 21:
			idx = 8
		case accuracy >= 11:
			idx = 9
		case accuracy >= 1:
			idx = 10
		}
		buckets[idx].Count++
		practiceCounts[idx] = append(practiceCounts[idx], *q.CountPractise)
	}

	// ================ 3. Break each accuracy bucket down by practice count ================
	for i := range buckets {
		buckets[i].PracticeCountBreakdown = common.BuildPracticeCountBuckets(practiceCounts[i])
	}

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, models.QuestionStats{
		AccuracyDistribution: buckets,
	}, c)
}

// GetQuestionLogs @Summary Get recent answer log entries for a question
// @Description Get the most recent answer log entries for a question, most recent first
// @Tags questions
// @Produce json
// @Param id path int true "Question ID"
// @Param limit query int false "Maximum number of entries to return (default: 15, max: 50)"
// @Success 200 {array} models.QuestionAnswerLogEntry "Recent answer log entries"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid question ID or limit parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/{id}/logs [get]
func (qc *QuestionController) GetQuestionLogs(c *gin.Context) {
	// ================ 1. Parse request parameters ================
	questionID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid question ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	limit, err := ParseIntQueryParam(c, "limit", 15)
	if err != nil || limit < 1 || limit > 50 {
		ResponseError(http.StatusBadRequest, "Invalid limit parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)

	// ================ 2. Fetch data from database ================
	where := squirrel.Eq{schema.QUESTION_ANSWER_LOG_QUESTION_ID: questionID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	logs, err := qc.questionAnswerLogPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	entries := qc.toQuestionAnswerLogEntries(logs)

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, entries, c)
}

// GetQuestionsTrend @Summary Get daily answer trend across all questions
// @Description Get daily practice count / accuracy rate across all questions over the last N days, zero-filled for days with no activity
// @Tags questions
// @Produce json
// @Param days query int false "Number of days to include (default: 30, max: 90)"
// @Success 200 {array} models.QuestionTrendPoint "Daily trend points, ascending by date"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid days parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/questions/trend [get]
func (qc *QuestionController) GetQuestionsTrend(c *gin.Context) {
	// ================ 1. Parse request parameters ================
	days, err := ParseIntQueryParam(c, "days", 30)
	if err != nil || days < 1 || days > 90 {
		ResponseError(http.StatusBadRequest, "Invalid days parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	now := time.Now()
	since := now.AddDate(0, 0, -(days - 1))
	where := squirrel.GtOrEq{schema.COMMON_CREATED_AT: since}
	logs, err := qc.questionAnswerLogPeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Aggregate into zero-filled daily trend points ================
	points := qc.buildQuestionTrendPoints(logs, days, now)

	// ================ 4. Send response ================
	ResponseSuccess(http.StatusOK, points, c)
}
