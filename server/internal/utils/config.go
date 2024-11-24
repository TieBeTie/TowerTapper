package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds the configuration values for the application
type Config struct {
	Port             string
	DatabaseURL      string
	Environment      string
	TelegramBotToken string
	JWTSecret        string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load .env file if it exists
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found. Using environment variables.")
	}

	config := &Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		Environment:      getEnv("ENVIRONMENT", "development"),
		TelegramBotToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
		JWTSecret:        getEnv("JWT_SECRET", ""),
	}

	return config
}

// getEnv retrieves the value of the environment variable key or returns the defaultValue
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
