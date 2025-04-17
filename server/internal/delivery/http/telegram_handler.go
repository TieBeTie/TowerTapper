package http

import (
	"log"
	"net/http"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

type TelegramHandler struct {
	bot           *tgbotapi.BotAPI
	playerUseCase *usecase.PlayerUseCase
}

func NewTelegramHandler(bot *tgbotapi.BotAPI, playerUseCase *usecase.PlayerUseCase) *TelegramHandler {
	return &TelegramHandler{bot: bot, playerUseCase: playerUseCase}
}

func (h *TelegramHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/webhook", h.HandleWebhook)
}

func (h *TelegramHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received webhook from Telegram: %s %s", r.Method, r.URL.String())
	_, err := h.bot.HandleUpdate(r)
	if err != nil {
		log.Printf("=== ERROR === Error processing webhook: %v", err)
		return
	}
	// ... здесь можно вставить остальную логику из main.go ...
}
