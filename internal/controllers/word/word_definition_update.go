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

// UpdateWordDefinition @Summary Update a word definition
// @Description Update an existing word definition's content
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word definition ID"
// @Param definition body models.WordDefinition true "Definition data to update"
// @Success 200 {object} models.Word "Word definition updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID or request body"
// @Failure 404 {object} models.ErrorResponse "Not found - Word definition not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/words/definition/{id} [put]
func (wc *Controller) UpdateWordDefinition(c *gin.Context) {
	// =============== 1. Parse request parameter & body ================
	// Get word definition ID from URL parameter
	wordDefID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word definition ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Request body
	wordDefinitionData, err := wc.parseAndValidateWordDefinitionRequest(c, true)
	if err != nil {
		common.RespondInvalidBody(err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordDefsModel := wordDefinitionData.ToDataModel()
	wordDefsModel.Id = nil // To prevent updating the ID field

	// ================ 3. Update data in database ================
	where := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	effected, err := wc.wordDefinitionPeer.Update(wordDefsModel, where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to update data in database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word definition not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 4. Query inserted data ================
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_ID)
	// Query updated word definition to get the associated word ID
	whereQueryDef := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	wordDefModels, err := wc.wordDefinitionPeer.Select([]*string{}, whereQueryDef, []*string{&orderBy}, nil, nil)
	if err != nil || len(wordDefModels) == 0 {
		common.ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}
	// Query the associated word
	wordID := *wordDefModels[0].WordId
	whereQuery := squirrel.Eq{schema.WORD_ID: wordID}
	wordEntities, err := wc.fetchWordsWithDefinitions([]*string{}, whereQuery, []*string{&orderBy}, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities[0], c)
}
