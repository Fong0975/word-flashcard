package routers

import (
	"net/http"
	"word-flashcard/internal/controllers/common"
	"word-flashcard/internal/middleware"
	"word-flashcard/internal/models"

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
	// Swagger routes
	setupSwaggerRoutes(router)
	// Unmatched route/method handlers
	setupErrorHandlers(router)

	return router, nil
}

// setMiddleware adds global middleware to the router
func setMiddleware(router *gin.Engine) {
	// Add global middleware
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.RecoveryMiddleware())
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

// setupErrorHandlers makes unmatched routes/methods respond with the same
// {"error", "code"} JSON shape used everywhere else, instead of gin's default
// plain-text 404/405.
func setupErrorHandlers(router *gin.Engine) {
	// gin only invokes NoMethod (instead of falling back to NoRoute) when this is enabled.
	router.HandleMethodNotAllowed = true

	router.NoRoute(func(c *gin.Context) {
		common.ResponseError(http.StatusNotFound, "Route not found", models.ErrCodeNotFound, nil, c)
	})
	router.NoMethod(func(c *gin.Context) {
		common.ResponseError(http.StatusMethodNotAllowed, "Method not allowed", models.ErrCodeInvalidRequest, nil, c)
	})
}
