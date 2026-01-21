package log

import (
	"log/slog"
	"word-flashcard/utils/config"

	"gopkg.in/natefinch/lumberjack.v2"
)

func InitLogger() {

	// Load log configs from environment variables or set defaults
	logFilename := config.GetOrDefault("LOG_FILE_PATH", "word-flashcard.log")
	logMaxSize := config.GetOrDefaultInt("LOG_FILE_MAX_SIZE_MB", 10)
	logLevelStr := config.GetOrDefault("LOG_LEVEL", "INFO")
	logLevel := slog.LevelInfo
	switch logLevelStr {
	case "DEBUG":
		logLevel = slog.LevelDebug
	case "WARN":
		logLevel = slog.LevelWarn
	case "ERROR":
		logLevel = slog.LevelError
	}

	// Set up lumberjack for log rotation
	rotator := &lumberjack.Logger{
		Filename:   logFilename,
		MaxSize:    logMaxSize,
		MaxBackups: 5,    // Keep the last 5 old files
		MaxAge:     28,   // Retain files for the past 28 days
		Compress:   false, // Compress file
	}

	// Initialize slog logger with lumberjack as output
	logger := slog.New(&CustomHandler{Writer: rotator, Level: logLevel})
	slog.SetDefault(logger)

	slog.Debug("Logger initialized", "file", logFilename, "max_size_mb", logMaxSize, "level", logLevelStr)
}
