package word

import (
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"
)

// toWordPracticeLogEntries converts data-layer practice log rows to the API response shape.
func (wc *Controller) toWordPracticeLogEntries(logs []*dbModels.WordPracticeLog) []models.WordPracticeLogEntry {
	entries := make([]models.WordPracticeLogEntry, 0, len(logs))
	for _, l := range logs {
		e := models.WordPracticeLogEntry{}
		if l.Id != nil {
			e.ID = *l.Id
		}
		if l.Familiarity != nil {
			e.Familiarity = *l.Familiarity
		}
		if l.PreviousFamiliarity != nil {
			e.PreviousFamiliarity = *l.PreviousFamiliarity
		}
		if l.CreatedAt != nil {
			e.CreatedAt = *l.CreatedAt
		}
		entries = append(entries, e)
	}
	return entries
}

// familiarityLevel maps a familiarity string to an ordinal 0/1/2 (red/yellow/green)
// so daily trends can compute improvement and averages numerically. Unrecognized
// or nil values default to red (0).
func familiarityLevel(f *string) int {
	if f == nil {
		return 0
	}
	switch *f {
	case schema.WORD_FAMILIARITY_YELLOW:
		return 1
	case schema.WORD_FAMILIARITY_GREEN:
		return 2
	default:
		return 0
	}
}

// buildWordTrendPoints aggregates practice logs into zero-filled daily trend
// points. improvement_rate is the share of that day's log entries where
// familiarity increased relative to previous_familiarity; avg_familiarity_score
// is the day's mean familiarity level (0/1/2) rescaled to 0-100.
func (wc *Controller) buildWordTrendPoints(logs []*dbModels.WordPracticeLog, days int, now time.Time) []models.WordTrendPoint {
	dateKeys := common.DailyDateKeys(days, now)
	points := make([]models.WordTrendPoint, len(dateKeys))
	idx := make(map[string]int, len(dateKeys))
	for i, k := range dateKeys {
		points[i] = models.WordTrendPoint{Date: k}
		idx[k] = i
	}

	type dayAgg struct {
		count, improved, scoreSum int
	}
	aggs := make(map[string]*dayAgg)
	for _, l := range logs {
		if l.CreatedAt == nil {
			continue
		}
		key := common.ReportDateKey(*l.CreatedAt)
		if _, ok := idx[key]; !ok {
			continue
		}
		a := aggs[key]
		if a == nil {
			a = &dayAgg{}
			aggs[key] = a
		}
		a.count++
		cur, prev := familiarityLevel(l.Familiarity), familiarityLevel(l.PreviousFamiliarity)
		if cur > prev {
			a.improved++
		}
		a.scoreSum += cur
	}
	for key, a := range aggs {
		i := idx[key]
		points[i].PracticeCount = a.count
		if a.count > 0 {
			points[i].ImprovementRate = common.Round1(float64(a.improved) * 100 / float64(a.count))
			points[i].AvgFamiliarityScore = common.Round1(float64(a.scoreSum) / float64(a.count) / 2 * 100)
		}
	}
	return points
}
