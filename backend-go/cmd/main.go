package main

import (
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/config"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/db"
	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	connection.ConnectDB(cfg.MongoURI)

	db.InitDB()

	r := gin.Default()

	r.SetTrustedProxies(nil)

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == cfg.ClientURL || cfg.ClientURL == "*" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
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

	routes.RegisterRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.String(200, "LMS Backend API is running (Go)")
	})
	r.Run(":" + cfg.Port)
}
