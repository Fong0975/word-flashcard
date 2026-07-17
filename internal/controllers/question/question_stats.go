package question

import (
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// StatsQuestions @Summary Get question statistics
// @Description Get question count distribution by accuracy rate in 10% intervals, each bucket further broken down by practice count
// @Tags questions
// @Produce json
// @Success 200 {object} models.QuestionStats "Question accuracy distribution"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch questions"
// @Router /api/questions/stats [get]
func (qc *Controller) StatsQuestions(c *gin.Context) {
	// ================ 1. Fetch minimal question data for accuracy computation ================
	cpCol := schema.QUESTION_COUNT_PRACTISE
	cfpCol := schema.QUESTION_COUNT_FAILURE_PRACTISE
	questions, err := qc.questionPeer.Select([]*string{&cpCol, &cfpCol}, nil, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch questions", models.ErrCodeInternalError, err, c)
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
	common.ResponseSuccess(http.StatusOK, models.QuestionStats{
		AccuracyDistribution: buckets,
	}, c)
}
