package config

import (
	"os"
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
