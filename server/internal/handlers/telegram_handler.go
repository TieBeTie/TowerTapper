package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/tiebetie/TowerTapper/internal/services"
)

type TelegramUpdate struct {
	Message struct {
		Text string `json:"text"`
	} `json:"message"`
}

func TelegramHandler(w http.ResponseWriter, r *http.Request) {
	var update TelegramUpdate
	err := json.NewDecoder(r.Body).Decode(&update)
	if err != nil {
		log.Printf("Error decoding Telegram update: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Optional: Validate a secret token to ensure the request is from Telegram
	// if r.Header.Get("X-Telegram-Token") != config.AppConfig.TelegramSecret {
	// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	// 	return
	// }

	// Process the command from the bot
	command := update.Message.Text
	log.Printf("Received Telegram command: %s", command)

	userService := services.NewUserService()
	err = userService.CreateUserAndRedirect(command)
	if err != nil {
		log.Printf("Error in CreateUserAndRedirect: %v", err)
		http.Error(w, "Failed to process command", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Command received"))
}
