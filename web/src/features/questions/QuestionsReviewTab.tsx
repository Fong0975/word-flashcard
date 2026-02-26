import React, { useState } from 'react';
import { useQuestions } from '../../hooks/useQuestions';
import { useModalManager, MODAL_NAMES } from '../../hooks/shared/useModalManager';
import { QuestionCard } from './QuestionCard';
import { EntityReviewTab } from '../shared/components/EntityReviewTab';
import { QuizSetupModal } from '../shared/components/QuizSetupModal';
import { QuestionDetailModal } from './question-detail/QuestionDetailModal';
import { QuestionFormModal } from './question-form/QuestionFormModal';
import { QuizModal } from '../../components/modals/QuizModal';
import { QuestionQuiz } from './quiz/QuestionQuiz';
import { QuestionQuizResults } from './quiz/QuestionQuizResults';
import { Question, QuestionQuizConfig, QuestionQuizResult } from '../../types/api';

interface QuestionsReviewTabProps {
  className?: string;
}

export const QuestionsReviewTab: React.FC<QuestionsReviewTabProps> = ({ className = '' }) => {
  const modalManager = useModalManager();
  const [quizConfig, setQuizConfig] = useState<QuestionQuizConfig | null>(null);

  const questionsHook = useQuestions({
    itemsPerPage: 20,
    autoFetch: true,
  });

  // Handle opening question detail modal
  const handleQuestionClick = (question: Question) => {
    modalManager.openModal(MODAL_NAMES.QUESTION_DETAIL, question);
  };

  // Handle closing question detail modal
  const handleCloseQuestionDetailModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUESTION_DETAIL);
  };

  // Handle question updated
  const handleQuestionUpdated = () => {
    // Just refresh the questions list
    // The QuestionDetailModal will handle refreshing its own data
    questionsHook.refresh();
  };

  // Handle question refreshed from detail modal
  const handleQuestionRefreshed = (updatedQuestion: Question) => {
    modalManager.setModalData(MODAL_NAMES.QUESTION_DETAIL, updatedQuestion);
  };

  // Handle opening add question modal
  const handleNew = () => {
    modalManager.openModal(MODAL_NAMES.ADD);
  };

  // Handle closing add question modal
  const handleCloseAddModal = () => {
    modalManager.closeModal(MODAL_NAMES.ADD);
  };

  // Handle question added successfully - refresh the question list and open detail modal
  const handleQuestionAdded = (newQuestion?: Question) => {
    questionsHook.refresh();

    // If a new question was created, open the detail modal to show it
    if (newQuestion) {
      modalManager.openModal(MODAL_NAMES.QUESTION_DETAIL, newQuestion);
    }
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
  const handleStartQuiz = (config: { questionCount: number; selectedFamiliarity?: string[] }) => {
    // Close the setup modal and open quiz modal
    modalManager.closeModal(MODAL_NAMES.QUIZ_SETUP);
    modalManager.openModal(MODAL_NAMES.QUIZ, config);

    // Set quiz config for QuestionQuizModal
    setQuizConfig({
      questionCount: config.questionCount
    });
  };

  // Handle closing quiz modal
  const handleCloseQuizModal = () => {
    modalManager.closeModal(MODAL_NAMES.QUIZ);
    setQuizConfig(null);
  };

  return (
    <EntityReviewTab
      config={{
        title: "Question Review",
        entityName: "Question",
        entityNamePlural: "Questions",
        enableSearch: false,
        enableQuiz: true,
        emptyStateConfig: {
          icon: "🧠",
          title: "No questions found",
          description: "This section provides review materials and random quizzes. You can practice various question types, including multiple-choice and fill-in-the-blank questions, and receive instant learning feedback.",
        },
      }}
      actions={{
        onNew: handleNew,
        onQuizSetup: handleQuizSetup,
        onRefresh: () => questionsHook.refresh(),
      }}
      entityListHook={questionsHook}
      renderCard={(question, index) => (
        <QuestionCard
          key={question.id}
          index={index}
          question={question}
          className="transition-transform duration-200 hover:scale-[1.01]"
          onClick={() => handleQuestionClick(question)}
        />
      )}
      additionalContent={
        <>
          {/* Question Detail Modal */}
          <QuestionDetailModal
            question={modalManager.getModalData<Question>(MODAL_NAMES.QUESTION_DETAIL) ?? null}
            isOpen={modalManager.isModalOpen(MODAL_NAMES.QUESTION_DETAIL)}
            onClose={handleCloseQuestionDetailModal}
            onQuestionUpdated={handleQuestionUpdated}
            onQuestionRefreshed={handleQuestionRefreshed}
          />

          {/* Add Question Modal */}
          <QuestionFormModal
            isOpen={modalManager.isModalOpen(MODAL_NAMES.ADD)}
            onClose={handleCloseAddModal}
            onQuestionSaved={handleQuestionAdded}
            mode="create"
          />

          {/* Quiz Setup Modal */}
          <QuizSetupModal
            isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ_SETUP)}
            onClose={handleCloseQuizSetupModal}
            onStartQuiz={handleStartQuiz}
            title="Question Quiz Setup"
            entityName="questions"
            enableFamiliaritySelection={false}
          />

          {/* Quiz Modal */}
          {quizConfig && (
            <QuizModal<QuestionQuizResult, QuestionQuizConfig>
              isOpen={modalManager.isModalOpen(MODAL_NAMES.QUIZ)}
              onClose={handleCloseQuizModal}
              quizConfig={quizConfig}
              config={{
                quizTitle: 'Question Quiz',
                resultsTitle: 'Quiz Results',
                exitConfirmTitle: 'Exit Quiz',
                exitConfirmMessage: 'Are you sure you want to exit the quiz? Your progress will be lost and you\'ll need to start over.',
                exitButtonText: 'Exit Quiz',
                continueButtonText: 'Continue Quiz'
              }}
              renderQuiz={(config, onComplete, onBackToHome) => (
                <QuestionQuiz
                  questionCount={config.questionCount}
                  onQuizComplete={onComplete}
                  onBackToHome={onBackToHome}
                />
              )}
              renderResults={(results, onRetake, onBackToHome) => (
                <QuestionQuizResults
                  results={results}
                  onRetakeQuiz={onRetake}
                  onBackToHome={onBackToHome}
                />
              )}
            />
          )}
        </>
      }
      className={className}
    />
  );
};