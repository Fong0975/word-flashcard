package word

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// UpdateWord @Summary Update a word
// @Description Update an existing word's properties like familiarity level
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Param word body models.Word true "Word data to update"
// @Success 200 {object} models.Word "Word updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID or request body"
// @Failure 404 {object} models.ErrorResponse "Not found - Word not found"
// @Failure 409 {object} models.ErrorResponse "Conflict - A word with this text already exists"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/words/{id} [put]
func (wc *Controller) UpdateWord(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get word ID from URL parameter
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	wordData, err := wc.parseAndValidateWordRequest(c, true)
	if err != nil {
		common.RespondInvalidBody(err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordModel := wordData.ToDataModel()
	wordModel.Id = nil // To prevent updating the ID field

	// ================ 3. Conditionally increment count_practise ================
	where := squirrel.Eq{schema.WORD_ID: wordID}
	var previousFamiliarity *string
	if wordData.IncrementCountPractise {
		currentWords, err := wc.wordPeer.Select([]*string{}, where, nil, nil, nil)
		if err != nil {
			common.ResponseError(http.StatusInternalServerError, "Failed to fetch current word data", models.ErrCodeInternalError, err, c)
			return
		} else if len(currentWords) == 0 {
			common.ResponseError(http.StatusNotFound, "Word not found", models.ErrCodeNotFound, nil, c)
			return
		}
		currentCount := 0
		if currentWords[0].CountPractise != nil {
			currentCount = *currentWords[0].CountPractise
		}
		newCount := currentCount + 1
		wordModel.CountPractise = &newCount
		previousFamiliarity = currentWords[0].Familiarity

		now := time.Now().UTC()
		wordModel.LastPracticedAt = &now
	}

	// ================ 4. Update data in database ================
	effected, err := wc.wordPeer.Update(wordModel, where)
	if err != nil {
		common.RespondDatabaseWriteError(
			"Failed to update data in database",
			"A word with this text already exists",
			err, c,
		)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 5. Log the familiarity change from this practice ================
	// Best-effort: the word's own update already succeeded above, so a
	// logging failure here must not turn into a user-facing error for an
	// update that already committed.
	if wordData.IncrementCountPractise {
		practiceLog := &dbModels.WordPracticeLog{
			WordId:              &wordID,
			Familiarity:         wordModel.Familiarity,
			PreviousFamiliarity: previousFamiliarity,
		}
		if _, err := wc.wordPracticeLogPeer.Insert(practiceLog); err != nil {
			slog.Error("Failed to log word practice", "word_id", wordID, "error", err)
		}
	}

	// ================ 6. Query updated data ================
	whereQuery := squirrel.Eq{schema.WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.WORD_ID)
	wordEntities, err := wc.fetchWordsWithDefinitions([]*string{}, whereQuery, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 7. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities[0], c)
}
