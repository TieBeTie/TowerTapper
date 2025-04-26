package http

import (
	"encoding/json"
	"log"
	"net/http"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

type TelegramHandler struct {
	bot            *tgbotapi.BotAPI
	playerUseCase  *usecase.PlayerUseCase
	commandHandler *TelegramCommandHandler
}

func NewTelegramHandler(bot *tgbotapi.BotAPI, playerUseCase *usecase.PlayerUseCase) *TelegramHandler {
	return &TelegramHandler{
		bot:            bot,
		playerUseCase:  playerUseCase,
		commandHandler: NewTelegramCommandHandler(bot, playerUseCase),
	}
}

func (h *TelegramHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/webhook", h.HandleWebhook)
}

func (h *TelegramHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received webhook from Telegram: %s %s", r.Method, r.URL.String())

	// Декодируем Update из запроса
	var update tgbotapi.Update
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		log.Printf("=== ERROR === Error decoding update: %v", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	// Обрабатываем команды через наш командный обработчик
	if update.Message != nil && update.Message.IsCommand() {
		h.commandHandler.HandleCommand(update)
	} else {
		// Обработка других типов сообщений и обновлений
		_, err := h.bot.HandleUpdate(r)
		if err != nil {
			log.Printf("=== ERROR === Error processing webhook: %v", err)
			return
		}
	}

	// Отправляем успешный ответ
	w.WriteHeader(http.StatusOK)
}
