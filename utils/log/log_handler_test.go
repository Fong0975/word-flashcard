package log

import (
	"bytes"
	"context"
	"log/slog"
	"strings"
	"testing"
	"time"
)

// TestCustomHandler_Enabled tests the Enabled method of CustomHandler
func TestCustomHandler_Enabled(t *testing.T) {
	tests := []struct {
		name          string
		configLevel   slog.Level
		incomingLevel slog.Level
		want          bool
	}{
		{"Info_Allowed_When_Level_Is_Info", slog.LevelInfo, slog.LevelInfo, true},
		{"Info_Denied_When_Level_Is_Warn", slog.LevelWarn, slog.LevelInfo, false},
		{"Error_Allowed_When_Level_Is_Warn", slog.LevelWarn, slog.LevelError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &CustomHandler{Level: tt.configLevel}
			if got := h.Enabled(context.Background(), tt.incomingLevel); got != tt.want {
				t.Errorf("Enabled() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestCustomHandler_Handle tests the Handle method of CustomHandler
func TestCustomHandler_Handle(t *testing.T) {
	// Mock for io.Writer
	buf := new(bytes.Buffer)
	h := &CustomHandler{
		Writer: buf,
		Level:  slog.LevelInfo,
	}

	// Mock slog.Record
	msg := "Test log message"
	level := slog.LevelInfo
	now := time.Now()

	// Create Record
	r := slog.NewRecord(now, level, msg, 0)

	// Test Handle method
	err := h.Handle(context.Background(), r)
	if err != nil {
		t.Fatalf("Handle() failed: %v", err)
	}

	// Verify output
	output := buf.String()

	// - contains message
	if !strings.Contains(output, msg) {
		t.Errorf("Output missing message: %q", output)
	}

	// - contains level
	if !strings.Contains(output, level.String()) {
		t.Errorf("Output missing level: %q", output)
	}

	// - contains time in expected format
	expectedTimePrefix := now.Format("2006/01/02")
	if !strings.Contains(output, expectedTimePrefix) {
		t.Errorf("Output time format mismatch: %q", output)
	}

	t.Logf("Final Log Output: %s", output)
}

// TestCustomHandler_HandleWithAttributes tests the Handle method with attributes
func TestCustomHandler_HandleWithAttributes(t *testing.T) {
	// Mock for io.Writer
	buf := new(bytes.Buffer)
	h := &CustomHandler{
		Writer: buf,
		Level:  slog.LevelInfo,
	}

	// Mock slog.Record with attributes
	msg := "Test log with attributes"
	level := slog.LevelInfo
	now := time.Now()

	// Create Record with attributes
	r := slog.NewRecord(now, level, msg, 0)
	r.AddAttrs(
		slog.String("log level", "INFO"),
		slog.String("component", "test"),
	)

	// Test Handle method
	err := h.Handle(context.Background(), r)
	if err != nil {
		t.Fatalf("Handle() failed: %v", err)
	}

	// Verify output
	output := buf.String()

	// - contains message
	if !strings.Contains(output, msg) {
		t.Errorf("Output missing message: %q", output)
	}

	// - contains level
	if !strings.Contains(output, level.String()) {
		t.Errorf("Output missing level: %q", output)
	}

	// - contains attributes in expected format
	if !strings.Contains(output, "[log level=INFO, component=test]") {
		t.Errorf("Output missing attributes: %q", output)
	}

	// - contains time in expected format
	expectedTimePrefix := now.Format("2006/01/02")
	if !strings.Contains(output, expectedTimePrefix) {
		t.Errorf("Output time format mismatch: %q", output)
	}

	t.Logf("Final Log Output with Attributes: %s", output)
}

// TestCustomHandler_HandleWithSingleAttribute tests the Handle method with a single attribute
func TestCustomHandler_HandleWithSingleAttribute(t *testing.T) {
	// Mock for io.Writer
	buf := new(bytes.Buffer)
	h := &CustomHandler{
		Writer: buf,
		Level:  slog.LevelInfo,
	}

	// Mock slog.Record with single attribute
	msg := "Logger initialized"
	level := slog.LevelInfo
	now := time.Now()

	// Create Record with single attribute
	r := slog.NewRecord(now, level, msg, 0)
	r.AddAttrs(slog.String("log level", "INFO"))

	// Test Handle method
	err := h.Handle(context.Background(), r)
	if err != nil {
		t.Fatalf("Handle() failed: %v", err)
	}

	// Verify output
	output := buf.String()

	// - contains message
	if !strings.Contains(output, msg) {
		t.Errorf("Output missing message: %q", output)
	}

	// - contains single attribute in expected format
	if !strings.Contains(output, "[log level=INFO]") {
		t.Errorf("Output missing single attribute: %q", output)
	}

	t.Logf("Final Log Output with Single Attribute: %s", output)
}

// TestCustomHandler_HandleWithNoAttributes tests the Handle method without attributes (existing behavior)
func TestCustomHandler_HandleWithNoAttributes(t *testing.T) {
	// Mock for io.Writer
	buf := new(bytes.Buffer)
	h := &CustomHandler{
		Writer: buf,
		Level:  slog.LevelInfo,
	}

	// Mock slog.Record without attributes
	msg := "Simple log message"
	level := slog.LevelInfo
	now := time.Now()

	// Create Record without attributes
	r := slog.NewRecord(now, level, msg, 0)

	// Test Handle method
	err := h.Handle(context.Background(), r)
	if err != nil {
		t.Fatalf("Handle() failed: %v", err)
	}

	// Verify output
	output := buf.String()

	// - contains message
	if !strings.Contains(output, msg) {
		t.Errorf("Output missing message: %q", output)
	}

	// - should NOT contain brackets (no attributes)
	if strings.Contains(output, "[") || strings.Contains(output, "]") {
		t.Errorf("Output should not contain attributes brackets: %q", output)
	}

	t.Logf("Final Log Output without Attributes: %s", output)
}