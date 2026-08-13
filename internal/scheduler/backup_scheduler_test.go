package scheduler

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"word-flashcard/data/mocks"
	dbModels "word-flashcard/data/models"
	"word-flashcard/internal/controllers/backup"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// createBackupFile writes a minimal backup file named to match
// backup.BackupFilePrefix, with an explicit modification time so tests can
// control ordering deterministically instead of relying on real-time gaps
// between file creations.
func createBackupFile(t *testing.T, dir, suffix string, modTime time.Time) string {
	t.Helper()

	require.NoError(t, os.MkdirAll(dir, 0o755))
	path := filepath.Join(dir, backup.BackupFilePrefix+suffix+".json")
	require.NoError(t, os.WriteFile(path, []byte("{}"), 0o644))
	require.NoError(t, os.Chtimes(path, modTime, modTime))
	return path
}

// newTestBackupController builds a *backup.Controller backed entirely by
// mocks, returning the peer mocks in the same order BuildExport queries them
// (word, question, note, word definition, question answer log, word
// practice log) so a test can set up or omit their Select() expectations.
func newTestBackupController(t *testing.T) (
	*backup.Controller,
	*mocks.MockWordPeer,
	*mocks.MockQuestionPeer,
	*mocks.MockNotePeer,
	*mocks.MockWordDefinitionsPeer,
	*mocks.MockQuestionAnswerLogPeer,
	*mocks.MockWordPracticeLogPeer,
) {
	t.Helper()

	wordPeer := mocks.NewMockWordPeer(t)
	wordDefinitionPeer := mocks.NewMockWordDefinitionsPeer(t)
	questionPeer := mocks.NewMockQuestionPeer(t)
	questionAnswerLogPeer := mocks.NewMockQuestionAnswerLogPeer(t)
	wordPracticeLogPeer := mocks.NewMockWordPracticeLogPeer(t)
	notePeer := mocks.NewMockNotePeer(t)
	backupPeer := mocks.NewMockBackupPeer(t)

	bc := backup.New(wordPeer, wordDefinitionPeer, questionPeer, questionAnswerLogPeer, wordPracticeLogPeer, notePeer, backupPeer)
	return bc, wordPeer, questionPeer, notePeer, wordDefinitionPeer, questionAnswerLogPeer, wordPracticeLogPeer
}

// expectSuccessfulExport sets up every peer mock to return an empty table
// for exactly one BuildExport call, letting WriteBackupFile succeed.
func expectSuccessfulExport(
	wordPeer *mocks.MockWordPeer,
	questionPeer *mocks.MockQuestionPeer,
	notePeer *mocks.MockNotePeer,
	wordDefinitionPeer *mocks.MockWordDefinitionsPeer,
	questionAnswerLogPeer *mocks.MockQuestionAnswerLogPeer,
	wordPracticeLogPeer *mocks.MockWordPracticeLogPeer,
) {
	wordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Word{}, nil).Times(1)
	questionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Question{}, nil).Times(1)
	notePeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.Note{}, nil).Times(1)
	wordDefinitionPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordDefinition{}, nil).Times(1)
	questionAnswerLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.QuestionAnswerLog{}, nil).Times(1)
	wordPracticeLogPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return([]*dbModels.WordPracticeLog{}, nil).Times(1)
}

// TestRunBackupIfDue covers every branch of the schedule-check-then-act
// decision: skipping when a recent backup already exists, writing a new
// backup file and pruning down to the retention count when one is due, and
// leaving the directory untouched (and skipping pruning) when the write
// itself fails.
func TestRunBackupIfDue(t *testing.T) {
	now := time.Now()
	interval := 72 * time.Hour

	t.Run("not due yet: recent backup exists, no peer is queried", func(t *testing.T) {
		dir := t.TempDir()
		createBackupFile(t, dir, "recent", now.Add(-1*time.Hour))
		bc, _, _, _, _, _, _ := newTestBackupController(t)

		runBackupIfDue(bc, dir, interval, 10)

		entries, err := os.ReadDir(dir)
		require.NoError(t, err)
		require.Len(t, entries, 1, "no new backup file should have been written")
	})

	t.Run("due: writes a new backup file and prunes down to the retention count", func(t *testing.T) {
		dir := t.TempDir()
		createBackupFile(t, dir, "oldest", now.Add(-100*time.Hour))
		createBackupFile(t, dir, "middle", now.Add(-80*time.Hour))
		bc, wordPeer, questionPeer, notePeer, wordDefinitionPeer, questionAnswerLogPeer, wordPracticeLogPeer := newTestBackupController(t)
		expectSuccessfulExport(wordPeer, questionPeer, notePeer, wordDefinitionPeer, questionAnswerLogPeer, wordPracticeLogPeer)

		runBackupIfDue(bc, dir, interval, 2)

		entries, err := os.ReadDir(dir)
		require.NoError(t, err)
		require.Len(t, entries, 2, "the newest backup should have been written and the oldest pruned")
		_, err = os.Stat(filepath.Join(dir, backup.BackupFilePrefix+"oldest.json"))
		require.True(t, os.IsNotExist(err), "oldest backup should have been pruned")
	})

	t.Run("write failure: error is only logged, no file is written, pruning is skipped", func(t *testing.T) {
		dir := t.TempDir()
		bc, wordPeer, _, _, _, _, _ := newTestBackupController(t)
		wordPeer.EXPECT().Select(mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
			Return(nil, errors.New("select failed")).Times(1)

		require.NotPanics(t, func() {
			runBackupIfDue(bc, dir, interval, 10)
		})

		entries, err := os.ReadDir(dir)
		require.NoError(t, err)
		require.Empty(t, entries, "no backup file should have been written on failure")
	})
}

// TestIsBackupDue covers every branch of the "is a new backup due" decision.
func TestIsBackupDue(t *testing.T) {
	now := time.Now()
	interval := 72 * time.Hour

	tests := []struct {
		name      string
		setupDir  func(t *testing.T) string
		wantDue   bool
		wantErr   bool
		checkAge  bool
		minAge    time.Duration
	}{
		{
			name:     "missing directory is always due",
			setupDir: func(t *testing.T) string { return filepath.Join(t.TempDir(), "does-not-exist") },
			wantDue:  true,
		},
		{
			name: "empty directory (no backup files) is always due",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				// An unrelated file should never be mistaken for a backup.
				require.NoError(t, os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("x"), 0o644))
				return dir
			},
			wantDue: true,
		},
		{
			name: "a recent backup is not due",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "recent", now.Add(-1*time.Hour))
				return dir
			},
			wantDue: false,
		},
		{
			name: "a backup older than the interval is due",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "old", now.Add(-100*time.Hour))
				return dir
			},
			wantDue:  true,
			checkAge: true,
			minAge:   99 * time.Hour,
		},
		{
			name: "only the newest of several backups is considered",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "old", now.Add(-100*time.Hour))
				createBackupFile(t, dir, "recent", now.Add(-1*time.Hour))
				return dir
			},
			wantDue: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := tt.setupDir(t)

			due, age, err := isBackupDue(dir, interval)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.Equal(t, tt.wantDue, due)
			if tt.checkAge {
				require.GreaterOrEqual(t, age, tt.minAge)
			}
		})
	}
}

// TestPruneOldBackups covers every branch of the retention cleanup.
func TestPruneOldBackups(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name       string
		setupDir   func(t *testing.T) string
		retain     int
		wantErr    bool
		wantExists []string // suffixes expected to survive
		wantGone   []string // suffixes expected to be removed
	}{
		{
			name:     "missing directory is a no-op",
			setupDir: func(t *testing.T) string { return filepath.Join(t.TempDir(), "does-not-exist") },
			retain:   10,
		},
		{
			name: "fewer files than retain removes nothing",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "a", now.Add(-1*time.Hour))
				createBackupFile(t, dir, "b", now)
				return dir
			},
			retain:     10,
			wantExists: []string{"a", "b"},
		},
		{
			name: "retain <= 0 disables pruning entirely",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "a", now.Add(-10*time.Hour))
				createBackupFile(t, dir, "b", now)
				return dir
			},
			retain:     0,
			wantExists: []string{"a", "b"},
		},
		{
			name: "excess files are removed oldest-first, newest kept",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "oldest", now.Add(-3*time.Hour))
				createBackupFile(t, dir, "middle", now.Add(-2*time.Hour))
				createBackupFile(t, dir, "newest", now.Add(-1*time.Hour))
				return dir
			},
			retain:     2,
			wantExists: []string{"middle", "newest"},
			wantGone:   []string{"oldest"},
		},
		{
			name: "non-backup files are ignored, not counted or deleted",
			setupDir: func(t *testing.T) string {
				dir := t.TempDir()
				createBackupFile(t, dir, "a", now.Add(-2*time.Hour))
				createBackupFile(t, dir, "b", now.Add(-1*time.Hour))
				require.NoError(t, os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("x"), 0o644))
				return dir
			},
			retain:     1,
			wantExists: []string{"b", "notes.txt"},
			wantGone:   []string{"a"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := tt.setupDir(t)

			err := pruneOldBackups(dir, tt.retain)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)

			for _, suffix := range tt.wantExists {
				name := suffix
				if suffix != "notes.txt" {
					name = backup.BackupFilePrefix + suffix + ".json"
				}
				_, err := os.Stat(filepath.Join(dir, name))
				require.NoErrorf(t, err, "expected %s to still exist", name)
			}
			for _, suffix := range tt.wantGone {
				name := backup.BackupFilePrefix + suffix + ".json"
				_, err := os.Stat(filepath.Join(dir, name))
				require.Truef(t, os.IsNotExist(err), "expected %s to have been removed", name)
			}
		})
	}
}
