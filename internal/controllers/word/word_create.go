package word

import (
	"fmt"
	"net/http"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// CreateWord @Summary Create a new word
// @Description Create a new word entry in the dictionary
// @Tags words
// @Accept json
// @Produce json
// @Param word body models.Word true "Word data to create"
// @Success 200 {object} models.Word "Word created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body"
// @Failure 409 {object} models.ErrorResponse "Conflict - A word with this text already exists"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/words [post]
func (wc *Controller) CreateWord(c *gin.Context) {
	// ================ 1. Parse request body ================
	wordData, err := wc.parseAndValidateWordRequest(c, false)
	if err != nil {
		common.RespondInvalidBody(err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordModel := wordData.ToDataModel()

	// ================ 3. Insert data into database ================
	// Insert word
	wordID, err := wc.wordPeer.Insert(wordModel)
	if err != nil {
		common.RespondDatabaseWriteError(
			"Failed to insert data into database",
			"A word with this text already exists",
			err, c,
		)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.WORD_ID)
	wordEntities, err := wc.fetchWordsWithDefinitions([]*string{}, where, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities[0], c)
}
