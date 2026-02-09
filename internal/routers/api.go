package routers

import (
	"log/slog"
	"word-flashcard/internal/controllers"
	"word-flashcard/internal/middleware"

	"github.com/gin-gonic/gin"
)

// ControllerDependencies holds all controller dependencies
type ControllerDependencies struct {
	HealthController     controllers.HealthControllerInterface
	DictionaryController controllers.DictionaryControllerInterface
	WordController       controllers.WordControllerInterface
}

// SetupAPIRoutes configures all API routes with default controllers
func SetupAPIRoutes(router *gin.Engine) {
	// Initialize default controllers
	wordPeer, wordDefinitionsPeer, err := controllers.GetReelPeers()
	if err != nil {
		slog.Error("Failed to initialize Word controller", "error", err)
		return
	}
	wordController := controllers.NewWordController(wordPeer, wordDefinitionsPeer)

	// Inject controllers into dependencies struct
	deps := &ControllerDependencies{
		HealthController:     controllers.NewHealthController(),
		DictionaryController: controllers.NewDictionaryController(),
		WordController:       wordController,
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

	// Words routes
	apiGroup.GET("/words", deps.WordController.ListWords)
	apiGroup.POST("/words/search", deps.WordController.SearchWords)
	apiGroup.POST("/words/random", deps.WordController.RandomWords)
	apiGroup.POST("/words", deps.WordController.CreateWord)
	apiGroup.PUT("/words/:id", deps.WordController.UpdateWord)
	apiGroup.DELETE("/words/:id", deps.WordController.DeleteWord)
	apiGroup.POST("/words/definition/:id", deps.WordController.CreateWordDefinition)
	apiGroup.PUT("/words/definition/:id", deps.WordController.UpdateWordDefinition)
	apiGroup.DELETE("/words/definition/:id", deps.WordController.DeleteWordDefinition)
}
