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
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using default values")
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
