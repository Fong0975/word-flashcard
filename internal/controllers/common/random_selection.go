package common

import "log/slog"

// LogRandomSelectionResult logs a step of a random-selection process (bucket
// fetch, fallback, or final summary). It logs at Warn when actual falls short
// of expected — a genuine shortage worth surfacing — and at Debug otherwise,
// since an exact match is routine tracing detail, not an incident.
func LogRandomSelectionResult(msg string, expected, actual int, args ...any) {
	if actual != expected {
		slog.Warn(msg, args...)
	} else {
		slog.Debug(msg, args...)
	}
}
