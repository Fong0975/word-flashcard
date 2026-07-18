package main

import (
	"testing"
)

// TestGetHTTPServer tests the getHTTPServer function
func TestGetHTTPServer(t *testing.T) {
	tests := []struct {
		name         string
		appPort      string
		expectedAddr string
	}{
		{
			name:         "custom APP_PORT is used",
			appPort:      "9090",
			expectedAddr: ":9090",
		},
		{
			name:         "missing APP_PORT falls back to default 8080",
			appPort:      "",
			expectedAddr: ":8080",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("APP_PORT", tt.appPort)

			server := getHTTPServer()

			if server == nil {
				t.Fatal("expected a non-nil *http.Server")
			}
			if server.Addr != tt.expectedAddr {
				t.Errorf("expected Addr %q, got %q", tt.expectedAddr, server.Addr)
			}
			if server.Handler == nil {
				t.Error("expected a non-nil Handler")
			}
		})
	}
}
