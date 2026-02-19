package main

import (
	"log"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/config"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/db"
	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load Config
	cfg := config.LoadConfig()

	// 2. Connect to Database
	connection.ConnectDB(cfg.MongoURI)

	// Initialize Indexes
	db.InitDB()

	// 3. Setup Gin
	r := gin.Default()

	// 3.1 Fix trusted proxies warning (Security best practice)
	r.SetTrustedProxies(nil)

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		// If origin is allowed (matches cfg.ClientURL), reflect it back
		if origin == cfg.ClientURL || cfg.ClientURL == "*" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// Fallback to cfg.ClientURL for default robustness
			c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.ClientURL)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "3600")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 4. Register All Routes
	routes.RegisterRoutes(r)

	// Home route
	r.GET("/", func(c *gin.Context) {
		c.String(200, "LMS Backend API is running (Go)")
	})

	// 5. Start Server
	log.Println("Server running on port " + cfg.Port)
	r.Run(":" + cfg.Port)
}
