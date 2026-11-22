package backup

import (
	"os"
	"path/filepath"
	"testing"

	"word-flashcard/internal/models"

	"github.com/stretchr/testify/require"
)

// TestReadBackupSummary covers every branch of reading the header counts: a
// valid header, a legacy file without one, a header that isn't the first key,
// and unreadable, empty or malformed input -- all of which must yield nil
// rather than an error.
func TestReadBackupSummary(t *testing.T) {
	tests := []struct {
		name    string
		content *string
		want    *models.BackupSummary
	}{
		{
			name:    "valid header returns the counts",
			content: strPtr(`{"summary":{"words":3,"questions":2,"notes":1},"exported_at":"2024-01-01T00:00:00Z","words":[]}`),
			want:    &models.BackupSummary{Words: 3, Questions: 2, Notes: 1},
		},
		{
			name:    "indented header returns the counts",
			content: strPtr("{\n  \"summary\": {\n    \"words\": 5,\n    \"questions\": 0,\n    \"notes\": 4\n  }\n}"),
			want:    &models.BackupSummary{Words: 5, Notes: 4},
		},
		{
			name:    "legacy file whose first key is not summary returns nil",
			content: strPtr(`{"exported_at":"2024-01-01T00:00:00Z","summary":{"words":1}}`),
		},
		{
			name:    "empty object returns nil",
			content: strPtr(`{}`),
		},
		{
			name:    "empty file returns nil",
			content: strPtr(``),
		},
		{
			name:    "top-level array returns nil",
			content: strPtr(`[1,2,3]`),
		},
		{
			name:    "summary of the wrong shape returns nil",
			content: strPtr(`{"summary":"oops"}`),
		},
		{
			name:    "truncated document returns nil",
			content: strPtr(`{"summary":{"words":`),
		},
		{
			name: "missing file returns nil",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), BackupFilePrefix+"20240101-000000.json")
			if tt.content != nil {
				require.NoError(t, os.WriteFile(path, []byte(*tt.content), 0o644))
			}

			require.Equal(t, tt.want, ReadBackupSummary(path))
		})
	}
}

func strPtr(s string) *string { return &s }
