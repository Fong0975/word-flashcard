package config

import (
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
