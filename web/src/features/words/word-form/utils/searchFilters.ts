import { Word } from '../../../../types/api';
import { SearchOperation, SearchLogic } from '../../../../types/base';

export const createWordSearchFilter = (searchTerm: string) => {
  return {
    conditions: [{
      key: 'word',
      operator: SearchOperation.LIKE,
      value: `%${searchTerm}%`,
    }],
    logic: SearchLogic.OR,
  };
};

export const createExactWordSearchFilter = (word: string) => {
  return {
    conditions: [{
      key: 'word',
      operator: SearchOperation.LIKE,
      value: word,
    }],
    logic: SearchLogic.OR,
  };
};

export const filterSearchSuggestions = (
  results: Word[],
  searchTerm: string,
  mode: 'create' | 'edit',
  editingWord?: Word
): Word[] => {
  return results.filter(w => {
    // Exclude exact matches with search term
    if (w.word.toLowerCase() === searchTerm.toLowerCase()) {
      return false;
    }
    // Exclude current editing word in edit mode
    if (mode === 'edit' && editingWord && w.id === editingWord.id) {
      return false;
    }
    return true;
  });
};