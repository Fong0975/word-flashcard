package routers

import (
	"net/http"
	"path/filepath"
	"word-flashcard/internal/handlers"

	"word-flashcard/internal/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter configures and returns the main gin router
func SetupRouter() (*gin.Engine, error) {
	// Create gin router
	router := gin.New()

	// Global middleware
	setMiddleware(router)
	// API routes
	SetupAPIRoutes(router)
	// Web routes
	webHandler, err := handlers.NewWebHandler()
	if err != nil {
		return nil, err
	}
	setupWebRoutes(router, webHandler)
	// Swagger routes
	setupSwaggerRoutes(router)

	return router, nil
}

// setMiddleware adds global middleware to the router
func setMiddleware(router *gin.Engine) {
	// Add global middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Recovery())
}

// setupWebRoutes configures web-related routes with injected handlers
func setupWebRoutes(router *gin.Engine, handler handlers.WebHandlerInterface) {
	// Index route
	router.GET("/", gin.WrapF(handler.IndexHandler))

	// Static files
	staticDir := filepath.Join("web", "static")
	router.Static("/static", staticDir)
}

// setupSwaggerRoutes configures Swagger documentation routes
func setupSwaggerRoutes(router *gin.Engine) {
	// Handle direct access to /swagger (without trailing slash)
	router.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/swagger/index.html")
	})

	// Swagger UI endpoint with wildcard handler
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
