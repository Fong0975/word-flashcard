package log

import "log/slog"

// LevelForStatus maps an HTTP status code to the slog level used to record
// it: 4xx (client error) logs as Warn, 5xx (server error) logs as Error, and
// anything else (2xx/3xx) logs as Info.
func LevelForStatus(statusCode int) slog.Level {
	switch {
	case statusCode >= 400 && statusCode < 500:
		return slog.LevelWarn
	case statusCode >= 500:
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
