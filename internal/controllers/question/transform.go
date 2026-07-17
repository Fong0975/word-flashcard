package question

import (
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// convertToEntities converts database models to API models
func (qc *Controller) convertToEntities(questions []*dbModels.Question) []*models.Question {
	var questionEntities []*models.Question
	for _, question := range questions {
		questionEntity := new(models.Question).FromDataModel(question)
		questionEntities = append(questionEntities, questionEntity)
	}

	return questionEntities
}

// toQuestionAnswerLogEntries converts data-layer answer log rows to the API response shape.
func (qc *Controller) toQuestionAnswerLogEntries(logs []*dbModels.QuestionAnswerLog) []models.QuestionAnswerLogEntry {
	entries := make([]models.QuestionAnswerLogEntry, 0, len(logs))
	for _, l := range logs {
		e := models.QuestionAnswerLogEntry{}
		if l.Id != nil {
			e.ID = *l.Id
		}
		if l.SelectedOption != nil {
			e.SelectedOption = *l.SelectedOption
		}
		if l.IsCorrect != nil {
			e.IsCorrect = *l.IsCorrect
		}
		if l.CreatedAt != nil {
			e.CreatedAt = *l.CreatedAt
		}
		entries = append(entries, e)
	}
	return entries
}

// buildQuestionTrendPoints aggregates answer logs into zero-filled daily
// trend points. accuracy_rate is the share of that day's log entries with
// IsCorrect true.
func (qc *Controller) buildQuestionTrendPoints(logs []*dbModels.QuestionAnswerLog, days int, now time.Time) []models.QuestionTrendPoint {
	dateKeys := common.DailyDateKeys(days, now)
	points := make([]models.QuestionTrendPoint, len(dateKeys))
	idx := make(map[string]int, len(dateKeys))
	for i, k := range dateKeys {
		points[i] = models.QuestionTrendPoint{Date: k}
		idx[k] = i
	}

	type dayAgg struct {
		count, correct int
	}
	aggs := make(map[string]*dayAgg)
	for _, l := range logs {
		if l.CreatedAt == nil {
			continue
		}
		key := l.CreatedAt.Format("2006-01-02")
		if _, ok := idx[key]; !ok {
			continue
		}
		a := aggs[key]
		if a == nil {
			a = &dayAgg{}
			aggs[key] = a
		}
		a.count++
		if l.IsCorrect != nil && *l.IsCorrect {
			a.correct++
		}
	}
	for key, a := range aggs {
		i := idx[key]
		points[i].PracticeCount = a.count
		if a.count > 0 {
			points[i].AccuracyRate = common.Round1(float64(a.correct) * 100 / float64(a.count))
		}
	}
	return points
}
