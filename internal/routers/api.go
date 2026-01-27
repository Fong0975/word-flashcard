package routers

import (
	"word-flashcard/internal/controllers"
	"word-flashcard/internal/middleware"

	"github.com/gin-gonic/gin"
)

// ControllerDependencies holds all controller dependencies
type ControllerDependencies struct {
	HealthController     controllers.HealthControllerInterface
	DictionaryController controllers.DictionaryControllerInterface
}

// SetupAPIRoutes configures all API routes with default controllers
func SetupAPIRoutes(router *gin.Engine) {
	// Initialize default controllers
	healthController := controllers.NewHealthController()
	dictionaryController := controllers.NewDictionaryController()

	// Inject controllers into dependencies struct
	deps := &ControllerDependencies{
		HealthController:     healthController,
		DictionaryController: dictionaryController,
	}

	// Setup routes with dependencies
	SetupAPIRoutesWithDependencies(router, deps)
}

// SetupAPIRoutesWithDependencies configures all API routes with injected controllers
func SetupAPIRoutesWithDependencies(router *gin.Engine, deps *ControllerDependencies) {
	// Create API route group with common middleware
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.JSONMiddleware())

	// Health routes
	apiGroup.GET("/health", deps.HealthController.HealthCheck)

	// Dictionary routes
	apiGroup.GET("/dictionary/:word", deps.DictionaryController.SearchWord)
}
