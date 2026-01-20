package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"

	"word-flashcard/api"
	"word-flashcard/handlers"
	"word-flashcard/utils/database"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using default values")
	}

	// Initialize database
	if err := initializeDatabase(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Create web handler
	webHandler, err := handlers.NewWebHandler()
	if err != nil {
		log.Fatal("Failed to initialize web handler:", err)
	}

	// Setup routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/status", api.StatusHandler)
	mux.HandleFunc("/api/dictionary/", api.DictionaryHandler)

	// Web routes
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

	// Start server
	fmt.Printf("Starting server on port %s...\n", port)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

// initializeDatabase initializes database connection and creates tables
func initializeDatabase() error {
	log.Println("Initializing database...")

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
		log.Printf("Warning: failed to close initialization connection: %v", err)
	}

	log.Println("Database initialized successfully")
	return nil
}
