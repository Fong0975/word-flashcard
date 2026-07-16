package word

import (
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/models"
)

// transformToWordEntities converts database models to API models with proper associations
func (wc *Controller) transformToWordEntities(words []*dbModels.Word, wordsDefs []*dbModels.WordDefinition) []*models.Word {
	var wordEntities []*models.Word
	for _, word := range words {
		// Collect all definitions belonging to current word
		var defsForWord []*dbModels.WordDefinition
		for _, def := range wordsDefs {
			if *def.WordId == *word.Id {
				defsForWord = append(defsForWord, def)
			}
		}

		// Create API model from database models
		wordEntity := new(models.Word).FromDataModel(word, defsForWord)
		wordEntities = append(wordEntities, wordEntity)
	}

	return wordEntities
}
