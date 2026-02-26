import React, { useState, useEffect } from 'react';

import { useWords } from '../../hooks/useWords';
import { useModalManager, MODAL_NAMES } from '../../hooks/shared/useModalManager';
import { useToast } from '../../hooks/ui/useToast';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { ToastContainer } from '../../components/ui';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import { WordQuizConfig as QuizConfig, Word, WordDefinition, BaseComponentProps } from '../../types';
import { WordQuizResult } from '../../types/api';
import { SearchOperation, SearchLogic, FamiliarityLevel } from '../../types/base';
import { QuizModal } from '../../components/modals/QuizModal';
import { apiService } from '../../lib/api';

import { WordFormModal } from './word-form';
import { WordDetailModal } from './word-detail/WordDetailModal';
import { DefinitionFormModal } from './definition-form';
import { WordQuiz } from './quiz/WordQuiz';
import { WordQuizResults } from './quiz/WordQuizResults';
import { WordCard } from './WordCard';

interface WordsReviewTabProps extends BaseComponentProps {}


export const WordsReviewTab: React.FC<WordsReviewTabProps> = ({ className = '' }) => {
  const modalManager = useModalManager();
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const { toasts, showError, showWarning, removeToast } = useToast();

  const wordsHook = useWords({
    itemsPerPage: 30,
    autoFetch: true,
  });

  // Update selected word when words list changes (after refresh)
  useEffect(() => {
    const selectedWord = modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL);

    if (selectedWord) {
      // Find the updated word in the current words list
      const updatedWord = wordsHook.words.find(w => w.id === selectedWord.id);
      if (updatedWord) {
        // Only update if the word content has actually changed
        if (JSON.stringify(updatedWord) !== JSON.stringify(selectedWord)) {
          modalManager.setModalData(MODAL_NAMES.WORD_DETAIL, updatedWord);
        }
      } else if (wordsHook.words.length > 0) {
        // If word is not found in current list (possibly due to filtering or pagination),
        // search for it explicitly using API
        const searchForUpdatedWord = async () => {
          try {
            const searchFilter = {
              conditions: [{
                key: 'word',
                operator: SearchOperation.LIKE,
                value: selectedWord.word,
              }],
              logic: SearchLogic.OR,
            };

            const searchResults = await apiService.searchWords({
              searchFilter,
              limit: 1,
            });

            // Update the selected word if found and content has changed
            if (searchResults.length > 0 && JSON.stringify(searchResults[0]) !== JSON.stringify(selectedWord)) {
              modalManager.setModalData(MODAL_NAMES.WORD_DETAIL, searchResults[0]);
            }
          } catch (error) {
            showError('Failed to refresh selected word. Please try again.');
          }
        };

        searchForUpdatedWord();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsHook.words, modalManager]);

  // Handle opening add word modal
  const handleNew = () => {
    modalManager.openModal(MODAL_NAMES.ADD);
  };

  // Handle closing add word modal
  const handleCloseAddModal = () => {
    modalManager.closeModal(MODAL_NAMES.ADD);
  };

  // Handle word added successfully - refresh the word list
  const handleWordAdded = () => {
    wordsHook.refresh();
  };

  // Handle opening quiz setup modal
  const handleQuizSetup = () => {
    modalManager.openModal(MODAL_NAMES.QUIZ_SETUP);
  };

  // Handle closing quiz setup modal
  const handleCloseQuizSetupModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
  };

  // Handle starting quiz
  const handleStartQuiz = (config: { questionCount: number; selectedFamiliarity?: FamiliarityLevel[] }) => {
    // Close the setup modal and open quiz modal
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    modalManager.openModal(MODAL_NAMES.QUIZ, config);

    // Set quiz config for WordQuizModal
    setQuizConfig({
      selectedFamiliarity: config.selectedFamiliarity || [],
      questionCount: config.questionCount,
    });
  };

  // Handle closing quiz modal
  const handleCloseQuizModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ);
    setQuizConfig(null);
  };


  // Handle opening WordDetailModal from WordFormModal suggestion
  const handleOpenWordDetailFromSuggestion = (word: Word) => {
    modalManager.openModal(MODAL_NAMES.WORD_DETAIL, word);
  };

  // Handle closing WordDetailModal
  const handleCloseWordDetailModal = () => {
    modalManager.closeModal(MODAL_NAMES.WORD_DETAIL);
  };

  // Handle word updated (familiarity, word text, etc.)
  const handleWordUpdated = () => {
    wordsHook.refresh(); // Refresh the words list
  };

  // Handle opening DefinitionFormModal for adding new definition
  const handleOpenDefinitionModal = () => {
    modalManager.openModal(MODAL_NAMES.DEFINITION_ADD, { mode: 'add' });
  };

  // Handle opening DefinitionFormModal for editing definition
  const handleOpenEditDefinitionModal = (definition: WordDefinition) => {
    modalManager.openModal(MODAL_NAMES.DEFINITION_EDIT, { mode: 'edit', definition });
  };

  // Handle closing DefinitionFormModal
  const handleCloseDefinitionFormModal = () => {
    modalManager.closeModal(MODAL_NAMES.DEFINITION_ADD);
    modalManager.closeModal(MODAL_NAMES.DEFINITION_EDIT);
  };

  // Handle definition added successfully
  const handleDefinitionAdded = () => {
    wordsHook.refresh(); // Refresh the words list
  };

  // Handle definition updated successfully
  const handleDefinitionUpdated = () => {
    wordsHook.refresh(); // Refresh the words list
  };

  return (
    <>
      <EntityReviewTab
        config={{
          title: 'Word Review',
          entityName: 'Word',
          entityNamePlural: 'Words',
          enableSearch: true,
          enableQuiz: true,
          searchPlaceholder: 'Search words...',
          emptyStateConfig: {
            icon: '📚',
            title: 'No words found',
            description: 'It looks like there are no words in your collection yet. Get started by adding your first word.',
          },
        }}
        actions={{
          onNew: handleNew,
          onQuizSetup: handleQuizSetup,
          onSearch: wordsHook.setSearchTerm,
          onRefresh: () => wordsHook.refresh(),
        }}
        entityListHook={wordsHook}
        renderCard={(word, index) => (
          <WordCard
            key={word.id}
            index={index}
            word={word}
            className="transition-transform duration-200 hover:scale-[1.02]"
            onWordUpdated={wordsHook.refresh}
          />
        )}
        additionalContent={
          <>
            {/* Add Word Modal */}
            <WordFormModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.ADD)}
              onClose={handleCloseAddModal}
              onWordSaved={handleWordAdded}
              onOpenWordDetail={handleOpenWordDetailFromSuggestion}
              mode="create"
              currentWords={wordsHook.words}
              onError={showError}
              onWarning={showWarning}
            />

            {/* Quiz Setup Modal */}
            <QuizSetupModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ_SETUP)}
              onClose={handleCloseQuizSetupModal}
              onStartQuiz={handleStartQuiz}
              title="Word Quiz Setup"
              entityName="words"
              enableFamiliaritySelection={true}
            />

            {/* Quiz Modal */}
            {quizConfig && (
              <QuizModal
                isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ)}
                onClose={handleCloseQuizModal}
                quizConfig={quizConfig}
                config={{
                  quizTitle: 'Word Quiz',
                  resultsTitle: 'Quiz Results',
                  exitConfirmTitle: 'Exit Quiz',
                  exitConfirmMessage: 'Are you sure you want to exit the quiz? Your progress will be lost and you\'ll need to start over.',
                  exitButtonText: 'Exit Quiz',
                  continueButtonText: 'Continue Quiz',
                }}
                renderQuiz={(config, onComplete, onBackToHome) => (
                  <WordQuiz
                    selectedFamiliarity={config.selectedFamiliarity}
                    questionCount={config.questionCount}
                    onQuizComplete={onComplete}
                    onBackToHome={onBackToHome}
                    onError={showError}
                  />
                )}
                renderResults={(results, onRetake, onBackToHome) => (
                  <WordQuizResults
                    results={results as WordQuizResult[]}
                    onRetakeQuiz={onRetake}
                    onBackToHome={onBackToHome}
                  />
                )}
              />
            )}

            {/* Word Detail Modal */}
            <WordDetailModal
              word={modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL) ?? null}
              isOpen={modalManager.isModalOpen(MODAL_NAMES.WORD_DETAIL)}
              onClose={handleCloseWordDetailModal}
              onWordUpdated={handleWordUpdated}
              onOpenDefinitionModal={handleOpenDefinitionModal}
              onOpenEditDefinitionModal={handleOpenEditDefinitionModal}
            />

            {/* Definition Form Modal for Adding */}
            <DefinitionFormModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.DEFINITION_ADD)}
              onClose={handleCloseDefinitionFormModal}
              onDefinitionAdded={handleDefinitionAdded}
              onDefinitionUpdated={handleDefinitionUpdated}
              wordId={modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL)?.id || null}
              wordText={modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL)?.word || null}
              mode="add"
              definition={null}
            />

            {/* Definition Form Modal for Editing */}
            <DefinitionFormModal
              isOpen={modalManager.isModalOpen(MODAL_NAMES.DEFINITION_EDIT)}
              onClose={handleCloseDefinitionFormModal}
              onDefinitionAdded={handleDefinitionAdded}
              onDefinitionUpdated={handleDefinitionUpdated}
              wordId={modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL)?.id || null}
              wordText={modalManager.getModalData<Word>(MODAL_NAMES.WORD_DETAIL)?.word || null}
              mode="edit"
              definition={modalManager.getModalData<{ mode: string; definition: WordDefinition }>(MODAL_NAMES.DEFINITION_EDIT)?.definition || null}
            />
          </>
        }
        className={className}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};