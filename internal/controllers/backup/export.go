package backup

import (
	"fmt"
	"net/http"
	"time"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/gin-gonic/gin"
)

// ExportData @Summary Export a full snapshot of every table
// @Description Returns every row of every table as a single JSON document, including ids and timestamps, suitable for a later POST /api/data/import restore.
// @Tags data
// @Produce json
// @Success 200 {object} models.DataExport "Full database snapshot"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/data/export [get]
func (bc *Controller) ExportData(c *gin.Context) {
	export, err := bc.BuildExport()
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	filename := fmt.Sprintf("word-flashcard-export-%s.json", time.Now().UTC().Format("20060102-150405"))
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	common.ResponseSuccess(http.StatusOK, export, c)
}

// BuildExport fetches every table, ordered by id, and assembles them into a
// single full-database snapshot. It has no HTTP dependency, so it's reusable
// both by ExportData (which streams the result as a download) and by the
// scheduled backup job (internal/scheduler), which writes it to disk instead.
func (bc *Controller) BuildExport() (*models.DataExport, error) {
	wordOrder := fmt.Sprintf("%s ASC", schema.WORD_ID)
	words, err := bc.wordPeer.Select([]*string{}, nil, []*string{&wordOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	questionOrder := fmt.Sprintf("%s ASC", schema.QUESTION_ID)
	questions, err := bc.questionPeer.Select([]*string{}, nil, []*string{&questionOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	noteOrder := fmt.Sprintf("%s ASC", schema.NOTE_ID)
	notes, err := bc.notePeer.Select([]*string{}, nil, []*string{&noteOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	wordDefinitionOrder := fmt.Sprintf("%s ASC", schema.WORD_DEFINITIONS_ID)
	wordDefinitions, err := bc.wordDefinitionPeer.Select([]*string{}, nil, []*string{&wordDefinitionOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	questionAnswerLogOrder := fmt.Sprintf("%s ASC", schema.QUESTION_ANSWER_LOG_ID)
	questionAnswerLogs, err := bc.questionAnswerLogPeer.Select([]*string{}, nil, []*string{&questionAnswerLogOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	wordPracticeLogOrder := fmt.Sprintf("%s ASC", schema.WORD_PRACTICE_LOG_ID)
	wordPracticeLogs, err := bc.wordPracticeLogPeer.Select([]*string{}, nil, []*string{&wordPracticeLogOrder}, nil, nil)
	if err != nil {
		return nil, err
	}

	return &models.DataExport{
		ExportedAt:         time.Now().UTC(),
		Words:              words,
		WordDefinitions:    wordDefinitions,
		Questions:          questions,
		QuestionAnswerLogs: questionAnswerLogs,
		WordPracticeLogs:   wordPracticeLogs,
		Notes:              notes,
	}, nil
}
