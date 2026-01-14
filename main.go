package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	"word-flashcard/api"
	"word-flashcard/handlers"
)

func main() {
	// Create web handler
	webHandler, err := handlers.NewWebHandler()
	if err != nil {
		log.Fatal("Failed to initialize web handler:", err)
	}

	// Setup routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/status", api.StatusHandler)

	// Web routes
	mux.HandleFunc("/", webHandler.IndexHandler)

	// Static files
	staticDir := filepath.Join("web", "static")
	fileServer := http.FileServer(http.Dir(staticDir))
	mux.Handle("/static/", http.StripPrefix("/static/", fileServer))

	// Server configuration
	port := "8080"
	addr := ":" + port

	// Start server
	fmt.Printf("Starting Word Flashcard server on port %s...\n", port)
	fmt.Printf("Visit: http://localhost:%s\n", port)
	fmt.Printf("API Status: http://localhost:%s/api/status\n", port)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
