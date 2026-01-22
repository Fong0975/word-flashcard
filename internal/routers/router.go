package routers

import (
	"path/filepath"

	"word-flashcard/handlers"
	"word-flashcard/internal/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter configures and returns the main gin router
func SetupRouter() (*gin.Engine, error) {
	// Create gin router
	router := gin.New()

	// Add global middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Recovery())

	// Setup API routes
	SetupAPIRoutes(router)

	// Setup web routes
	if err := setupWebRoutes(router); err != nil {
		return nil, err
	}

	// Setup Swagger routes
	setupSwaggerRoutes(router)

	return router, nil
}

// setupWebRoutes configures web-related routes (non-API)
func setupWebRoutes(router *gin.Engine) error {
	// Create web handler
	webHandler, err := handlers.NewWebHandler()
	if err != nil {
		return err
	}

	// Index route
	router.GET("/", gin.WrapF(webHandler.IndexHandler))

	// Static files
	staticDir := filepath.Join("web", "static")
	router.Static("/static", staticDir)

	return nil
}

// setupSwaggerRoutes configures Swagger documentation routes
func setupSwaggerRoutes(router *gin.Engine) {
	// Handle direct access to /swagger (without trailing slash)
	router.GET("/swagger", func(c *gin.Context) {
		c.Redirect(302, "/swagger/index.html")
	})

	// Swagger UI endpoint with wildcard handler
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}
