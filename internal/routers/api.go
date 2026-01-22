package routers

import (
	"word-flashcard/internal/controllers"
	"word-flashcard/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupAPIRoutes configures all API routes
func SetupAPIRoutes(router *gin.Engine) {
	// Create API route group with common middleware
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.JSONMiddleware())

	// Initialize controllers
	healthController := controllers.NewHealthController()
	dictionaryController := controllers.NewDictionaryController()

	// Health routes
	apiGroup.GET("/health", healthController.HealthCheck)

	// Dictionary routes
	apiGroup.GET("/dictionary/:word", dictionaryController.SearchWord)
}
