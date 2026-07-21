package common

import (
	"context"
	"log/slog"
)

// LogRandomSelectionResult logs a step of a random-selection process (bucket
// fetch, fallback, or final summary). It logs at Warn when actual falls short
// of expected — a genuine shortage worth surfacing — and at Debug otherwise,
// since an exact match is routine tracing detail, not an incident.
func LogRandomSelectionResult(msg string, expected, actual int, args ...any) {
	LogRandomSelectionResultAtLevel(msg, slog.LevelWarn, expected, actual, args...)
}

// LogRandomSelectionResultAtLevel behaves like LogRandomSelectionResult but lets
// the caller choose the level used on a mismatch. Use this instead of
// LogRandomSelectionResult for buckets where a shortfall is routine rather than
// a genuine incident (e.g. the unpractised question bucket, which underflows
// often once a user's queue empties out) so it doesn't get logged at Warn.
func LogRandomSelectionResultAtLevel(msg string, mismatchLevel slog.Level, expected, actual int, args ...any) {
	if actual != expected {
		slog.Log(context.Background(), mismatchLevel, msg, args...)
	} else {
		slog.Debug(msg, args...)
	}
}
