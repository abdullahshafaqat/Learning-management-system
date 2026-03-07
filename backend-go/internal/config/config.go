package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	MongoURI      string
	JWTSecret     string
	ClientURL     string
	CloudinaryURL string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		_ = godotenv.Load("../.env")
	}

	mongoURI := getEnv("MONGO_URI", "")
	if mongoURI == "" {
		mongoURI = getEnv("MONGODB_URI", "mongodb://localhost:27017/lms")
	}

	cloudinaryURL := getEnv("CLOUDINARY_URL", "")
	if cloudinaryURL == "" {
		cloudName := getEnv("CLOUDINARY_CLOUD_NAME", "")
		apiKey := getEnv("CLOUDINARY_API_KEY", "")
		apiSecret := getEnv("CLOUDINARY_API_SECRET", "")
		if cloudName != "" && apiKey != "" && apiSecret != "" {
			cloudinaryURL = "cloudinary://" + apiKey + ":" + apiSecret + "@" + cloudName
		}
	}

	jwtSecret := getEnv("JWT_SECRET", "default_secret")

	return &Config{
		Port:          getEnv("PORT", "5000"),
		MongoURI:      mongoURI,
		JWTSecret:     jwtSecret,
		ClientURL:     getEnv("CLIENT_URL", "http://localhost:3000"),
		CloudinaryURL: cloudinaryURL,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
