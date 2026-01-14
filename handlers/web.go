package handlers

import (
	"html/template"
	"net/http"
	"path/filepath"
)

// WebHandler handles web page requests
type WebHandler struct {
	templates *template.Template
}

// NewWebHandler creates a new web handler instance
func NewWebHandler() (*WebHandler, error) {
	// Load HTML templates
	templatesPath := filepath.Join("web", "templates", "*.html")
	tmpl, err := template.ParseGlob(templatesPath)
	if err != nil {
		return nil, err
	}

	return &WebHandler{
		templates: tmpl,
	}, nil
}

// IndexHandler serves the main HTML page
func (h *WebHandler) IndexHandler(w http.ResponseWriter, r *http.Request) {
	// Set content type
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Execute template
	if err := h.templates.ExecuteTemplate(w, "index.html", nil); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
