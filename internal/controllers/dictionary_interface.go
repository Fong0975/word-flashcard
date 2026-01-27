package controllers

import "github.com/gin-gonic/gin"

// DictionaryControllerInterface defines the interface for dictionary controller
type DictionaryControllerInterface interface {
	SearchWord(c *gin.Context)
}
