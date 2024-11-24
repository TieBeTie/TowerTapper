package config

import (
	"log"

	"github.com/tiebetie/TowerTapper/internal/utils"
)

// AppConfig holds the application-wide configuration
var AppConfig *utils.Config

// LoadAppConfig initializes and loads the application configuration
func LoadAppConfig() {
	utils.InitLogger()
	AppConfig = utils.LoadConfig()

	// Validate essential configuration fields
	if AppConfig.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set in the environment variables")
	}
	if AppConfig.JWTSecret == "" {
		log.Fatal("JWT_SECRET is not set in the environment variables")
	}
	if AppConfig.TelegramSecret == "" { // Assuming you have a Telegram secret
		log.Fatal("TELEGRAM_SECRET is not set in the environment variables")
	}
	// Add more validations as needed
}
