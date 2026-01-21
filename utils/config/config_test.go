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
			envValue:     "abc", // 無法轉為 int
			defaultValue: 30,
			want:         30,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				t.Setenv(tt.key, tt.envValue)
			} else {
				os.Unsetenv(tt.key) // 確保環境變數是乾淨的
			}

			got := GetOrDefaultInt(tt.key, tt.defaultValue)
			if got != tt.want {
				t.Errorf("GetOrDefaultInt() = %v, want %v", got, tt.want)
			}
		})
	}
}
