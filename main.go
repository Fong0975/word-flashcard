package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
	"word-flashcard/utils/log"

	"github.com/joho/godotenv"

	"word-flashcard/api"
	"word-flashcard/handlers"
	"word-flashcard/utils/database"
)

func main() {
	// Call bootstrap to set up environment and logger or exit on failure
	if err := bootstrap(); err != nil {
		fmt.Println("Bootstrap error:", err)
		return
	}

	slog.Info("=============== Start Start Up Server ===============")

	// Initialize database
	if err := initializeDatabase(); err != nil {
		slog.Error("Failed to initialize database:", "error", err)
	}

	// Get HTTP server
	server := getHTTPServer()

	_, port, err := net.SplitHostPort(server.Addr)
	if err != nil {
		port = "unknown"
	}
	fmt.Printf("Starting server on port %s...\n", port)
	slog.Info("Starting server on port " + port)

	slog.Info("=============== Completed Start Up Server ===============")

	// Run HTTP server
	runHTTPServer(server)
}

func bootstrap() error {
	// Load .env file first
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf(".env file not found, using default values: %v", err)
	}

	// Initialize logger after loading .env
	log.InitLogger()

	return nil
}

// getHTTPServer sets up and returns the HTTP server
func getHTTPServer() *http.Server {
	// Setup routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/status", api.StatusHandler)
	mux.HandleFunc("/api/dictionary/", api.DictionaryHandler)

	// Web routes
	// Create web handler
	webHandler, err := handlers.NewWebHandler()
	if err != nil {
		slog.Error("Failed to initialize web handler", "error", err)
	}
	mux.HandleFunc("/", webHandler.IndexHandler)

	// Static files
	staticDir := filepath.Join("web", "static")
	fileServer := http.FileServer(http.Dir(staticDir))
	mux.Handle("/static/", http.StripPrefix("/static/", fileServer))

	// Server configuration
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080" // Default main server port
	}
	addr := ":" + port

	// Create and return HTTP server
	return &http.Server{
		Addr:    addr,
		Handler: mux,
	}
}

func runHTTPServer(server *http.Server) {
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
		}
	}()

	// Create channel to listen for OS signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Wait for signal
	<-quit
	slog.Debug("Server shutdown signal received")

	// Create context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server shutdown error", "error", err)
		slog.Info("Server stopped forcefully")
	} else {
		slog.Info("Server stopped")
	}
}

// initializeDatabase initializes database connection and creates tables
func initializeDatabase() error {
	slog.Info("Initializing database start")

	// Register table schemas to memory
	database.RegisterTableSchemas()

	// Create database instance from environment variables
	db, err := database.NewDatabaseFromEnv()
	if err != nil {
		return fmt.Errorf("failed to create database instance: %v", err)
	}

	// Connect to database
	if err := db.Connect(); err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Initialize tables
	if err := db.InitializeTables(); err != nil {
		db.Close()
		return fmt.Errorf("failed to initialize tables: %v", err)
	}

	// Close the initialization connection
	if err := db.Close(); err != nil {
		slog.Warn("Failed to close database connection", "error", err)
	}

	slog.Info("Database initialized successfully")
	return nil
}
