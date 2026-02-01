package controllers

import (
	"fmt"
	"net/http"
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// WordController handles word-related requests
type WordController struct {
	wordPeer           peers.WordPeerInterface
	wordDefinitionPeer peers.WordDefinitionsPeerInterface
}

// NewWordController creates a new WordController instance
func NewWordController(wordPeer peers.WordPeerInterface, wordDefinition peers.WordDefinitionsPeerInterface) *WordController {
	return &WordController{
		wordPeer:           wordPeer,
		wordDefinitionPeer: wordDefinition,
	}
}

// GetReelPeers returns the real database peers
func GetReelPeers() (peers.WordPeerInterface, peers.WordDefinitionsPeerInterface, error) {
	wordPeer, err := peers.NewWordPeer()
	if err != nil {
		return nil, nil, err
	}

	wordDefinitionPeer, err := peers.NewWordDefinitionsPeer()
	if err != nil {
		return nil, nil, err
	}

	return wordPeer, wordDefinitionPeer, nil
}

// ListWords @Summary List all words
// @Description Get all words with their definitions and pronunciation information
// @Tags words
// @Accept json
// @Produce json
// @Success 200 {array} models.Word "List of words retrieved successfully"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words [get]
func (wc *WordController) ListWords(c *gin.Context) {
	// ================ 1. Fetch data from database ================
	// Query 'words' table
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_ID)
	words, err := wc.wordPeer.Select([]*string{}, nil, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	}

	// Query 'word_definitions' table
	wordsDefs, err := wc.getWordDefinitionsByWords(words)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	}

	// ================ 2. Transform data to API model ================
	wordEntities := convertToEntities(words, wordsDefs)

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities, c)
}

// SearchWords @Summary Search words with filters
// @Description Search for words using specified filter criteria
// @Tags words
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Success 200 {array} models.Word "Words found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or filter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/search [post]
func (wc *WordController) SearchWords(c *gin.Context) {
	// ============== 1. Get search filter from request ================
	var searchReq models.SearchFilter
	err := ParseRequestBody(&searchReq, c)
	if err != nil || searchReq.Operator != "eq" {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Fetch data from database ================
	where := squirrel.Eq{searchReq.Key: searchReq.Value}
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_ID)
	wordEntities, err := wc.queryWord([]*string{}, where, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", err, c)
		return
	}
	if len(wordEntities) == 0 {
		wordEntities = []*models.Word{}
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities, c)
}

// CreateWord @Summary Create a new word
// @Description Create a new word entry in the dictionary
// @Tags words
// @Accept json
// @Produce json
// @Param word body models.Word true "Word data to create"
// @Success 200 {object} models.Word "Word created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to insert data into database"
// @Router /api/words [post]
func (wc *WordController) CreateWord(c *gin.Context) {
	// ================ 1. Parse request body ================
	wordData, err := wc.getAndValidateRequestedWord(c, false)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordModel := wordData.ToDataModel()

	// ================ 3. Insert data into database ================
	// Insert word
	wordID, err := wc.wordPeer.Insert(wordModel)
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to insert data into database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.WORD_ID)
	wordEntities, err := wc.queryWord([]*string{}, where, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities[0], c)
}

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
func (wc *WordController) CreateWordDefinition(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get word ID from URL parameter
	wordID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid word ID.", err, c)
		return
	}

	// Request body
	wordDefinitionData, err := wc.getAndValidateRequestedWordDefinitions(c, false)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordDefsModel := wordDefinitionData.ToDataModel()

	// ================ 3. Insert data into database ================
	// Insert word definition
	wordDefsModel.WordId = &wordID
	if _, err := wc.wordDefinitionPeer.Insert(wordDefsModel); err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to insert data into database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	where := squirrel.Eq{schema.WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.WORD_ID)
	wordEntities, err := wc.queryWord([]*string{}, where, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Inserted but failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities[0], c)
}

// UpdateWord @Summary Update a word
// @Description Update an existing word's properties like familiarity level
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Param word body models.Word true "Word data to update"
// @Success 200 {object} models.Word "Word updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID or request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/words/{id} [put]
func (wc *WordController) UpdateWord(c *gin.Context) {
	// ================ 1. Parse request parameter & body ================
	// Get word ID from URL parameter
	wordID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid word ID.", err, c)
		return
	}

	wordData, err := wc.getAndValidateRequestedWord(c, true)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordModel := wordData.ToDataModel()
	wordModel.Id = nil // To prevent updating the ID field

	// ================ 3. Update data in database ================
	where := squirrel.Eq{schema.WORD_ID: wordID}
	if effected, err := wc.wordPeer.Update(wordModel, where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to update data in database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	whereQuery := squirrel.Eq{schema.WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.WORD_ID)
	wordEntities, err := wc.queryWord([]*string{}, whereQuery, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities[0], c)
}

// UpdateWordDefinition @Summary Update a word definition
// @Description Update an existing word definition's content
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word definition ID"
// @Param definition body models.WordDefinition true "Definition data to update"
// @Success 200 {object} models.Word "Word definition updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID or request body"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to update data in database"
// @Router /api/words/definition/{id} [put]
func (wc *WordController) UpdateWordDefinition(c *gin.Context) {
	// =============== 1. Parse request parameter & body ================
	// Get word definition ID from URL parameter
	wordDefID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid word definition ID.", err, c)
		return
	}

	// Request body
	wordDefinitionData, err := wc.getAndValidateRequestedWordDefinitions(c, true)
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid request body", err, c)
		return
	}

	// ================ 2. Convert to data model ================
	wordDefsModel := wordDefinitionData.ToDataModel()
	wordDefsModel.Id = nil // To prevent updating the ID field

	// ================ 3. Update data in database ================
	where := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	if effected, err := wc.wordDefinitionPeer.Update(wordDefsModel, where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to update data in database", err, c)
		return
	}

	// ================ 4. Query inserted data ================
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_ID)
	// Query updated word definition to get the associated word ID
	whereQueryDef := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	wordDefModels, err := wc.wordDefinitionPeer.Select([]*string{}, whereQueryDef, []*string{&orderBy})
	if err != nil || len(wordDefModels) == 0 {
		ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", err, c)
		return
	}
	// Query the associated word
	wordID := *wordDefModels[0].WordId
	whereQuery := squirrel.Eq{schema.WORD_ID: wordID}
	wordEntities, err := wc.queryWord([]*string{}, whereQuery, []*string{&orderBy})
	if err != nil {
		ResponseError(http.StatusInternalServerError, "Updated but failed to fetch data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusOK, wordEntities[0], c)
}

// DeleteWord @Summary Delete a word
// @Description Delete a word and all its associated definitions
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Success 204 "Word deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/{id} [delete]
func (wc *WordController) DeleteWord(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word ID from URL parameter
	wordID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid word ID.", err, c)
		return
	}

	// ================ 2. Delete data from database ================
	// Delete word definitions associated with the word
	whereDefs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: wordID}
	if _, err := wc.wordDefinitionPeer.Delete(whereDefs); err != nil {
		ResponseError(http.StatusInternalServerError, "Failed to delete associated data from database", err, c)
		return
	}
	// Delete the word
	where := squirrel.Eq{schema.WORD_ID: wordID}
	if effected, err := wc.wordPeer.Delete(where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to delete data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusNoContent, nil, c)
}

// DeleteWordDefinition @Summary Delete a word definition
// @Description Delete a specific word definition
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word definition ID"
// @Success 204 "Word definition deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/definition/{id} [delete]
func (wc *WordController) DeleteWordDefinition(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word definition ID from URL parameter
	wordDefID, err := parseIDFromPath(c, "id")
	if err != nil {
		ResponseError(http.StatusBadRequest, "Invalid word definition ID.", err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	if effected, err := wc.wordDefinitionPeer.Delete(where); err != nil || effected == 0 {
		ResponseError(http.StatusInternalServerError, "Failed to delete data from database", err, c)
		return
	}

	// ================ 3. Send response ================
	ResponseSuccess(http.StatusNoContent, nil, c)
}
