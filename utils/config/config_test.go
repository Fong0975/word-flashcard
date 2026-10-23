package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGetOrDefault(t *testing.T) {
	// Define test cases
	tests := []struct {
		name         string
		key          string
		envValue     string
		defaultValue string
		want         string
	}{
		{
			name:         "Env variable exists",
			key:          "APP_PORT",
			envValue:     "8080",
			defaultValue: "3000",
			want:         "8080",
		},
		{
			name:         "Env variable does not exist",
			key:          "NON_EXISTENT_KEY",
			envValue:     "",
			defaultValue: "default_val",
			want:         "default_val",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				t.Setenv(tt.key, tt.envValue)
			}

			got := GetOrDefault(tt.key, tt.defaultValue)

			if got != tt.want {
				t.Errorf("GetOrDefault() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetOrDefaultInt(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		envValue     string
		defaultValue int
		want         int
	}{
		{
			name:         "Convert to Int",
			key:          "MAX_USERS",
			envValue:     "100",
			defaultValue: 10,
			want:         100,
		},
		{
			name:         "Env variable does not exist",
			key:          "RETRY_COUNT",
			envValue:     "",
			defaultValue: 3,
			want:         3,
		},
		{
			name:         "Env variable is not a valid Int",
			key:          "TIMEOUT",
			envValue:     "abc", // cannot be converted to int
			defaultValue: 30,
			want:         30,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				t.Setenv(tt.key, tt.envValue)
			} else {
				os.Unsetenv(tt.key) // ensure the environment variable is clean
			}

			got := GetOrDefaultInt(tt.key, tt.defaultValue)
			if got != tt.want {
				t.Errorf("GetOrDefaultInt() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetOrDefaultBool(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		envValue     string
		defaultValue bool
		want         bool
	}{
		{
			name:         "Convert to bool true",
			key:          "BACKUP_ENABLED",
			envValue:     "true",
			defaultValue: false,
			want:         true,
		},
		{
			name:         "Convert to bool false",
			key:          "BACKUP_ENABLED",
			envValue:     "false",
			defaultValue: true,
			want:         false,
		},
		{
			name:         "Env variable does not exist",
			key:          "FEATURE_FLAG",
			envValue:     "",
			defaultValue: true,
			want:         true,
		},
		{
			name:         "Env variable is not a valid bool",
			key:          "FEATURE_FLAG",
			envValue:     "not-a-bool",
			defaultValue: true,
			want:         true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				t.Setenv(tt.key, tt.envValue)
			} else {
				os.Unsetenv(tt.key) // ensure the environment variable is clean
			}

			got := GetOrDefaultBool(tt.key, tt.defaultValue)
			if got != tt.want {
				t.Errorf("GetOrDefaultBool() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetSecretOrDefault(t *testing.T) {
	const key = "TEST_SECRET"

	tests := []struct {
		name         string
		envValue     string
		fileContent  *string
		missingFile  bool
		defaultValue string
		want         string
		wantErr      bool
	}{
		{
			name:         "Neither file nor env variable set",
			defaultValue: "default_val",
			want:         "default_val",
		},
		{
			name:         "Env variable set without file",
			envValue:     "from-env",
			defaultValue: "default_val",
			want:         "from-env",
		},
		{
			name:         "File takes precedence over env variable",
			envValue:     "from-env",
			fileContent:  ptr("from-file"),
			defaultValue: "default_val",
			want:         "from-file",
		},
		{
			name:        "Trailing LF is trimmed",
			fileContent: ptr("s3cret\n"),
			want:        "s3cret",
		},
		{
			name:        "Trailing CRLF is trimmed",
			fileContent: ptr("s3cret\r\n"),
			want:        "s3cret",
		},
		{
			name:        "Surrounding spaces are kept",
			fileContent: ptr(" s3 cret \n"),
			want:        " s3 cret ",
		},
		{
			name:         "Empty file falls back to default",
			envValue:     "from-env",
			fileContent:  ptr(""),
			defaultValue: "default_val",
			want:         "default_val",
		},
		{
			name:        "Missing file returns error",
			envValue:    "from-env",
			missingFile: true,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv(key, tt.envValue)
			t.Setenv(key+"_FILE", "")

			path := filepath.Join(t.TempDir(), "secret")
			if tt.fileContent != nil {
				if err := os.WriteFile(path, []byte(*tt.fileContent), 0o600); err != nil {
					t.Fatalf("failed to write secret file: %v", err)
				}
			}
			if tt.fileContent != nil || tt.missingFile {
				t.Setenv(key+"_FILE", path)
			}

			got, err := GetSecretOrDefault(key, tt.defaultValue)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GetSecretOrDefault() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("GetSecretOrDefault() unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("GetSecretOrDefault() = %q, want %q", got, tt.want)
			}
		})
	}
}

func ptr(s string) *string {
	return &s
}
