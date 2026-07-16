package controllers

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"
	dbModels "word-flashcard/data/models"
	"word-flashcard/data/peers"
	"word-flashcard/data/schema"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/models"

	"github.com/Masterminds/squirrel"
	"github.com/gin-gonic/gin"
)

// wordSortableColumns defines the columns allowed in sort query parameters for the words table.
var wordSortableColumns = []string{
	schema.WORD_ID,
	schema.WORD_WORD,
	schema.WORD_FAMILIARITY,
	schema.WORD_COUNT_PRACTISE,
	schema.COMMON_CREATED_AT,
}

// WordController handles word-related requests
type WordController struct {
	wordPeer            peers.WordPeerInterface
	wordDefinitionPeer  peers.WordDefinitionsPeerInterface
	wordPracticeLogPeer peers.WordPracticeLogPeerInterface
}

// NewWordController creates a new WordController instance
func NewWordController(wordPeer peers.WordPeerInterface, wordDefinition peers.WordDefinitionsPeerInterface, wordPracticeLogPeer peers.WordPracticeLogPeerInterface) *WordController {
	return &WordController{
		wordPeer:            wordPeer,
		wordDefinitionPeer:  wordDefinition,
		wordPracticeLogPeer: wordPracticeLogPeer,
	}
}

// GetReelPeers returns the real database peers
func GetReelPeers() (peers.WordPeerInterface, peers.WordDefinitionsPeerInterface, peers.WordPracticeLogPeerInterface, error) {
	wordPeer, err := peers.NewWordPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	wordDefinitionPeer, err := peers.NewWordDefinitionsPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	wordPracticeLogPeer, err := peers.NewWordPracticeLogPeer()
	if err != nil {
		return nil, nil, nil, err
	}

	return wordPeer, wordDefinitionPeer, wordPracticeLogPeer, nil
}

// ListWords @Summary List all words with pagination
// @Description Get all words with their definitions and pronunciation information, supports pagination through query parameters
// @Tags words
// @Accept json
// @Produce json
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Success 200 {array} models.Word "List of words retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words [get]
func (wc *WordController) ListWords(c *gin.Context) {
	// ================ 1. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 2. Fetch data from database ================
	// Query 'words' table
	orderBy := fmt.Sprintf("%s ASC", schema.WORD_WORD)
	words, err := wc.wordPeer.Select([]*string{}, nil, []*string{&orderBy}, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// Query 'word_definitions' table
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Transform data to API model ================
	wordEntities := wc.transformToWordEntities(words, wordsDefs)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}

// SearchWords @Summary Search words with filters and pagination
// @Description Search for words using specified filter criteria across both words and word_definitions tables. Supports equal, not equal, in, and not in operations with pagination.
// @Tags words
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Param limit query int false "Maximum number of records to return (default: 100, max: 1000)"
// @Param offset query int false "Number of records to skip (default: 0)"
// @Param sort query string false "Sort columns, comma-separated. Format: col,-col. Allowed: id,word,familiarity,count_practise,created_at"
// @Success 200 {array} models.Word "Words found matching the search criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body, filter, or query parameters"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/search [post]
func (wc *WordController) SearchWords(c *gin.Context) {
	// ============== 1. Get search filter from request ================
	var searchReq models.SearchFilter
	err := common.ParseRequestBody(&searchReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Parse pagination parameters ================
	limit, offset, err := common.ParseLimitAndOffsetFromPath(c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid limit/offset parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Convert to *uint64 for database layer
	limitPtr := uint64(limit)
	offsetPtr := uint64(offset)

	// ================ 3. Parse and validate sort parameters ================
	sortParam, err := models.ParseSortParam(c.Query("sort"))
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	if err := sortParam.Validate(wordSortableColumns); err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid sort parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Build ORDER BY clauses: use provided sort or fall back to default
	var orderByClauses []*string
	if !sortParam.IsEmpty() {
		orderByClauses = sortParam.ToOrderByClauses()
	} else {
		defaultOrder := fmt.Sprintf("%s ASC", schema.WORD_WORD)
		orderByClauses = []*string{&defaultOrder}
	}

	// ================ 4. Handle empty search filter ================
	if searchReq.IsEmpty() {
		// No filter, fetch all records with pagination
		wordEntities, err := wc.fetchWordsWithDefinitions([]*string{}, nil, orderByClauses, &limitPtr, &offsetPtr)
		if err != nil {
			common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
			return
		}
		if len(wordEntities) == 0 {
			wordEntities = []*models.Word{}
		}
		common.ResponseSuccess(http.StatusOK, wordEntities, c)
		return
	}

	// ================ 5. Separate conditions by table ================
	wordsFilter, wordDefsFilter, err := parseSearchConditionsByTable(&searchReq)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid filter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 6. Query each table separately ================
	wordsIDs, err := wc.queryWordIDsByTableFilter(wordsFilter, false)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to query words table", models.ErrCodeInternalError, err, c)
		return
	}

	wordDefsIDs, err := wc.queryWordIDsByTableFilter(wordDefsFilter, true)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to query word_definitions table", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 7. Combine results based on logic operator ================
	finalWordIDs := wc.combineWordIDsWithLogic(wordsIDs, wordDefsIDs, searchReq.Logic)

	// ================ 8. Query final words with pagination ================
	wordEntities, err := wc.queryWordsByIDsWithPagination(finalWordIDs, orderByClauses, &limitPtr, &offsetPtr)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch final word data from database", models.ErrCodeInternalError, err, c)
		return
	}
	if len(wordEntities) == 0 {
		wordEntities = []*models.Word{}
	}

	// ================ 9. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}

// RandomWords @Summary Get random words weighted by familiarity and practice recency
// @Description Get random words for a quiz, weighted by familiarity ratio (familiarity_levels) or exact quota (per_category_counts); prioritizes never-practiced then longest-idle words
// @Tags words
// @Accept json
// @Produce json
// @Param randomRequest body models.WordRandomRequest true "Random request criteria including count and either familiarity_levels or per_category_counts"
// @Success 200 {array} models.Word "Random words retrieved successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or count parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/random [post]
func (wc *WordController) RandomWords(c *gin.Context) {
	// ============== 1. Get random request from body ================
	var randomReq models.WordRandomRequest
	err := common.ParseRequestBody(&randomReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// Validate count parameter
	if randomReq.Count <= 0 || randomReq.Count > 1000 {
		common.ResponseError(http.StatusBadRequest, "Count must be between 1 and 1000", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 2. Determine per-level quotas ================
	var quotas map[string]int
	if len(randomReq.PerCategoryCounts) > 0 {
		quotas = randomReq.PerCategoryCounts
	} else if len(randomReq.FamiliarityLevels) > 0 {
		quotas = computeLevelQuotas(randomReq.Count, randomReq.FamiliarityLevels)
	} else {
		common.ResponseError(http.StatusBadRequest, "Either familiarity_levels or per_category_counts is required", models.ErrCodeValidationError, nil, c)
		return
	}

	// ================ 3. Fetch weighted random words ================
	words, err := wc.fetchRandomWordsWeighted(quotas)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 4. Attach definitions and build response ================
	wordsDefs, err := wc.fetchWordDefinitionsForWords(words)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}
	wordEntities := wc.transformToWordEntities(words, wordsDefs)
	if len(wordEntities) == 0 {
		wordEntities = []*models.Word{}
	}

	// ================ 5. Send response ================
	common.ResponseSuccess(http.StatusOK, wordEntities, c)
}

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
func (wc *WordController) CreateWord(c *gin.Context) {
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
func (wc *WordController) UpdateWord(c *gin.Context) {
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

		now := time.Now()
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
func (wc *WordController) UpdateWordDefinition(c *gin.Context) {
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

// DeleteWord @Summary Delete a word
// @Description Delete a word and all its associated definitions
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word ID"
// @Success 204 "Word deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Word not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/{id} [delete]
func (wc *WordController) DeleteWord(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word ID from URL parameter
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	// Check if there are word definitions associated with the word
	whereDefs := squirrel.Eq{schema.WORD_DEFINITIONS_WORD_ID: wordID}
	existingDefs, err := wc.wordDefinitionPeer.Select([]*string{}, whereDefs, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to check associated data in database", models.ErrCodeInternalError, err, c)
		return
	}

	// Delete word definitions only if they exist
	if len(existingDefs) > 0 {
		if _, err := wc.wordDefinitionPeer.Delete(whereDefs); err != nil {
			common.ResponseError(http.StatusInternalServerError, "Failed to delete associated data from database", models.ErrCodeInternalError, err, c)
			return
		}
	}

	// Delete the word
	where := squirrel.Eq{schema.WORD_ID: wordID}
	effected, err := wc.wordPeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}

// DeleteWordDefinition @Summary Delete a word definition
// @Description Delete a specific word definition
// @Tags words
// @Accept json
// @Produce json
// @Param id path int true "Word definition ID"
// @Success 204 "Word definition deleted successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid definition ID"
// @Failure 404 {object} models.ErrorResponse "Not found - Word definition not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to delete data from database"
// @Router /api/words/definition/{id} [delete]
func (wc *WordController) DeleteWordDefinition(c *gin.Context) {
	// =============== 1. Parse request parameter ================
	// Get word definition ID from URL parameter
	wordDefID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word definition ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Delete data from database ================
	where := squirrel.Eq{schema.WORD_DEFINITIONS_ID: wordDefID}
	effected, err := wc.wordDefinitionPeer.Delete(where)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to delete data from database", models.ErrCodeInternalError, err, c)
		return
	} else if effected == 0 {
		common.ResponseError(http.StatusNotFound, "Word definition not found", models.ErrCodeNotFound, nil, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusNoContent, nil, c)
}

// CountWords @Summary Count words matching filter criteria
// @Description Count the number of words that match the specified filter criteria across both words and word_definitions tables
// @Tags words
// @Accept json
// @Produce json
// @Param searchFilter body models.SearchFilter true "Search filter criteria"
// @Success 200 {object} map[string]int64 "Count of words matching the filter criteria"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid request body or filter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/count [post]
func (wc *WordController) CountWords(c *gin.Context) {
	// ============== 1. Get search filter from request ================
	var searchReq models.SearchFilter
	err := common.ParseRequestBody(&searchReq, c)
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid request body", models.ErrCodeInvalidRequest, err, c)
		return
	}

	// ================ 2. Count words using same logic as SearchWords ================
	count, err := wc.countWordsMatchingFilter(&searchReq)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 3. Send response ================
	common.ResponseSuccess(http.StatusOK, gin.H{"count": count}, c)
}

// StatsWords @Summary Get word statistics
// @Description Get word count distribution by familiarity level and practice count
// @Tags words
// @Produce json
// @Success 200 {object} models.WordStats "Word familiarity distribution"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to count words"
// @Router /api/words/stats [get]
func (wc *WordController) StatsWords(c *gin.Context) {
	// ================ 1. Count per familiarity level ================
	red, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_RED})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}
	yellow, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_YELLOW})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}
	green, err := wc.wordPeer.Count(squirrel.Eq{schema.WORD_FAMILIARITY: schema.WORD_FAMILIARITY_GREEN})
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to count words", models.ErrCodeInternalError, err, c)
		return
	}

	// ================ 2. Fetch practice counts for all words ================
	cpCol := schema.WORD_COUNT_PRACTISE
	words, err := wc.wordPeer.Select([]*string{&cpCol}, nil, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch practice counts", models.ErrCodeInternalError, err, c)
		return
	}

	counts := make([]int, len(words))
	for i, w := range words {
		if w.CountPractise != nil {
			counts[i] = *w.CountPractise
		}
	}

	// ================ 3. Bucket words by practice count ================
	practiceBuckets := common.BuildPracticeCountBuckets(counts)

	// ================ 4. Send response ================
	common.ResponseSuccess(http.StatusOK, models.WordStats{
		FamiliarityDistribution: models.WordFamiliarityDistribution{
			Red:    red,
			Yellow: yellow,
			Green:  green,
		},
		PracticeCountDistribution: practiceBuckets,
	}, c)
}

// GetWordLogs @Summary Get recent practice log entries for a word
// @Description Get the most recent practice log entries for a word, most recent first
// @Tags words
// @Produce json
// @Param id path int true "Word ID"
// @Param limit query int false "Maximum number of entries to return (default: 10, max: 50)"
// @Success 200 {array} models.WordPracticeLogEntry "Recent practice log entries"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid word ID or limit parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/{id}/logs [get]
func (wc *WordController) GetWordLogs(c *gin.Context) {
	wordID, err := common.ParseIDFromPath(c, "id")
	if err != nil {
		common.ResponseError(http.StatusBadRequest, "Invalid word ID.", models.ErrCodeInvalidRequest, err, c)
		return
	}

	limit, err := common.ParseIntQueryParam(c, "limit", 10)
	if err != nil || limit < 1 || limit > 50 {
		common.ResponseError(http.StatusBadRequest, "Invalid limit parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}
	limitPtr := uint64(limit)

	where := squirrel.Eq{schema.WORD_PRACTICE_LOG_WORD_ID: wordID}
	orderBy := fmt.Sprintf("%s DESC", schema.COMMON_CREATED_AT)
	logs, err := wc.wordPracticeLogPeer.Select([]*string{}, where, []*string{&orderBy}, &limitPtr, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	common.ResponseSuccess(http.StatusOK, wc.toWordPracticeLogEntries(logs), c)
}

// GetWordsTrend @Summary Get daily practice trend across all words
// @Description Get daily practice count / improvement rate / average familiarity score across all words over the last N days, zero-filled for days with no activity
// @Tags words
// @Produce json
// @Param days query int false "Number of days to include (default: 30, max: 90)"
// @Success 200 {array} models.WordTrendPoint "Daily trend points, ascending by date"
// @Failure 400 {object} models.ErrorResponse "Bad request - Invalid days parameter"
// @Failure 500 {object} models.ErrorResponse "Internal server error - Failed to fetch data from database"
// @Router /api/words/trend [get]
func (wc *WordController) GetWordsTrend(c *gin.Context) {
	days, err := common.ParseIntQueryParam(c, "days", 30)
	if err != nil || days < 1 || days > 90 {
		common.ResponseError(http.StatusBadRequest, "Invalid days parameter", models.ErrCodeInvalidRequest, err, c)
		return
	}

	now := time.Now()
	since := now.AddDate(0, 0, -(days - 1))
	where := squirrel.GtOrEq{schema.COMMON_CREATED_AT: since}
	logs, err := wc.wordPracticeLogPeer.Select([]*string{}, where, nil, nil, nil)
	if err != nil {
		common.ResponseError(http.StatusInternalServerError, "Failed to fetch data from database", models.ErrCodeInternalError, err, c)
		return
	}

	common.ResponseSuccess(http.StatusOK, wc.buildWordTrendPoints(logs, days, now), c)
}
