package api

import (
	"log/slog"
	"net/http"
)

const (
	API_PATH_PREFIX = "/api/"
	METHOD_GET      = "GET"
	METHOD_POST     = "POST"
	METHOD_PUT      = "PUT"
	METHOD_DELETE   = "DELETE"
)

// RouteRegister defines an interface for registering routes to an HTTP server mux
type RouteRegister interface {
	Register(mux *http.ServeMux)
}

// GetModules returns a slice of RouteRegister implementations for the API
func GetModules() []RouteRegister {
	return []RouteRegister{
		&DictionaryHandler{},
		&HealthHandler{},
	}
}

// RegisterAPIMethod registers an API method with the given HTTP method, path, and handler function
func RegisterAPIMethod(mux *http.ServeMux, method string, path string, handlerFunc http.HandlerFunc) {
	fullPath := API_PATH_PREFIX + path
	slog.Debug("Registering method", "method", method, "fullPath", fullPath)

	mux.HandleFunc(method+" "+fullPath, func(w http.ResponseWriter, r *http.Request) {
		// Set common headers
		w.Header().Set("Content-Type", "application/json")

		// Log the request
		requestPath := r.URL.Path
		if r.URL.RawQuery != "" {
			requestPath += "?" + r.URL.RawQuery
		}
		slog.Info("Received request", "method", r.Method, "path", requestPath)

		handlerFunc(w, r)
	})
}
