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

// CreateWordDefinition @Summary Create a word definition
// @Description Add a new definition to an existing word
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Param definition body models.WordDefinition true "Word definition data"
// @Success 200 {object} models.Word "Word definition created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID or request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/words/definition/{id} [post]
func (wc *Controller) CreateWordDefinition(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get word ID from URL parameter
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Request body
	wordDefinitionData, err := wc.parseAndValidateWordDefinitionRequest(c, false)
	if err != nil {
		common.RespondInvalidBody(err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordDefsModel := wordDefinitionData.ToDataModel()

	// ================ 3. Insert data into database ================
	// Insert word definition
	wordDefsModel.WordId = &wordID
	if _, err := wc.wordDefinitionPeer.Insert(wordDefsModel); err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to insert data into database", models.ErrCodeInternalError, err, c)
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
