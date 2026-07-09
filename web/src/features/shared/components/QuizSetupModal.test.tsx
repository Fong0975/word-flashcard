import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuizSetupModal } from './QuizSetupModal';

describe('QuizSetupModal', () => {
  describe('without familiarity selection', () => {
    it('shows only the question count input', () => {
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Question Quiz Setup'
          entityName='question'
        />,
      );

      expect(screen.getByRole('spinbutton')).toHaveValue(15);
      expect(
        screen.queryByText('Select Familiarity Levels'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Words per Category')).not.toBeInTheDocument();
    });

    it('starts the quiz with the question count and closes', async () => {
      const user = userEvent.setup();
      const onStartQuiz = jest.fn();
      const onClose = jest.fn();
      render(
        <QuizSetupModal
          isOpen
          onClose={onClose}
          onStartQuiz={onStartQuiz}
          title='Question Quiz Setup'
          entityName='question'
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Start Quiz' }));

      expect(onStartQuiz).toHaveBeenCalledWith({ questionCount: 15 });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disables Start Quiz when the count is invalid', async () => {
      const user = userEvent.setup();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Question Quiz Setup'
          entityName='question'
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);

      expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeDisabled();
    });

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(
        <QuizSetupModal
          isOpen
          onClose={onClose}
          onStartQuiz={jest.fn()}
          title='Question Quiz Setup'
          entityName='question'
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('with familiarity selection', () => {
    it('defaults to the by-category mode with the count inputs visible', () => {
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      expect(screen.getByText('Words per Category')).toBeInTheDocument();
      expect(
        screen.queryByText('Select Familiarity Levels'),
      ).not.toBeInTheDocument();
    });

    it('starts the quiz with per-category counts by default', async () => {
      const user = userEvent.setup();
      const onStartQuiz = jest.fn();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={onStartQuiz}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Start Quiz' }));

      expect(onStartQuiz).toHaveBeenCalledWith({
        questionCount: 0,
        perCategoryCounts: { red: 7, yellow: 5, green: 3 },
      });
    });

    it('disables Start Quiz when every category count is zero', async () => {
      const user = userEvent.setup();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      for (const input of screen.getAllByRole('spinbutton')) {
        await user.clear(input);
        await user.type(input, '0');
      }

      expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeDisabled();
    });

    it('switches to total-count mode showing familiarity selection', async () => {
      const user = userEvent.setup();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Total Count' }));

      expect(screen.getByText('Select Familiarity Levels')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
      expect(screen.queryByText('Words per Category')).not.toBeInTheDocument();
    });

    it('disables Start Quiz in total mode once every familiarity level is deselected', async () => {
      const user = userEvent.setup();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={jest.fn()}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Total Count' }));
      for (const checkbox of screen.getAllByRole('checkbox')) {
        await user.click(checkbox);
      }

      expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeDisabled();
    });

    it('starts the quiz with the selected familiarity levels in total mode', async () => {
      const user = userEvent.setup();
      const onStartQuiz = jest.fn();
      render(
        <QuizSetupModal
          isOpen
          onClose={jest.fn()}
          onStartQuiz={onStartQuiz}
          title='Word Quiz Setup'
          entityName='word'
          enableFamiliaritySelection
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Total Count' }));
      await user.click(screen.getByRole('button', { name: 'Start Quiz' }));

      expect(onStartQuiz).toHaveBeenCalledWith(
        expect.objectContaining({
          questionCount: 15,
          selectedFamiliarity: expect.any(Array),
        }),
      );
      const [config] = onStartQuiz.mock.calls[0];
      expect(config.selectedFamiliarity).toHaveLength(3);
    });
  });
});
