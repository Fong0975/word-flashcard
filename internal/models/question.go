package models

import (
	"strings"
	"word-flashcard/data/models"
	"word-flashcard/utils"
)

// Question represents a question used in both requests and responses
type Question struct {
	ID                   *int    `json:"id"`
	Question             *string `json:"question"`
	OptionA              *string `json:"option_a"`
	OptionB              *string `json:"option_b"`
	OptionC              *string `json:"option_c"`
	OptionD              *string `json:"option_d"`
	Answer               *string `json:"answer"`
	Reference            *string `json:"reference"`
	Notes                *string `json:"notes"`
	CountPractise        *int    `json:"count_practise"`
	CountFailurePractise *int    `json:"count_failure_practise"`
}

// FromDataModel converts a data model Question to the API model Question
func (q *Question) FromDataModel(dbQuestion *models.Question) *Question {
	q.ID = dbQuestion.Id
	q.Question = dbQuestion.Question
	q.OptionA = dbQuestion.OptionA
	q.OptionB = dbQuestion.OptionB
	q.OptionC = dbQuestion.OptionC
	q.OptionD = dbQuestion.OptionD
	q.Answer = dbQuestion.Answer
	q.Reference = dbQuestion.Reference
	q.Notes = dbQuestion.Notes
	q.CountPractise = dbQuestion.CountPractise
	q.CountFailurePractise = dbQuestion.CountFailurePractise

	return q
}

// ToDataModel converts the API model Question to the data model Question
func (q *Question) ToDataModel() *models.Question {
	// Convert answer to uppercase
	upperAnswer := q.Answer
	if upperAnswer != nil {
		upperAnswer = utils.StrPtr(strings.ToUpper(*upperAnswer))
	}

	return &models.Question{
		Id:                   q.ID,
		Question:             q.Question,
		OptionA:              q.OptionA,
		OptionB:              q.OptionB,
		OptionC:              q.OptionC,
		OptionD:              q.OptionD,
		Answer:               upperAnswer,
		Reference:            q.Reference,
		Notes:                q.Notes,
		CountPractise:        q.CountPractise,
		CountFailurePractise: q.CountFailurePractise,
	}
}

// QuestionRandomRequest represents the request structure for random questions
type QuestionRandomRequest struct {
	Count int `json:"count" binding:"required,min=1,max=1000"`
}
