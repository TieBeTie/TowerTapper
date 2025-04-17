package main

import (
	"net/http"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	myhttp "github.com/tiebetie/TowerTapper/internal/delivery/http"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

func RegisterAllHandlers(mux *http.ServeMux, playerUseCase *usecase.PlayerUseCase, bot *tgbotapi.BotAPI, wsHandlerFunc http.HandlerFunc) {
	ratingHandler := myhttp.NewRatingHandler(playerUseCase)
	ratingHandler.RegisterRoutes(mux)

	purchaseHandler := myhttp.NewPurchaseHandler(playerUseCase)
	purchaseHandler.RegisterRoutes(mux)

	wsHandler := myhttp.NewWebsocketHandler(wsHandlerFunc)
	wsHandler.RegisterRoutes(mux)

	telegramHandler := myhttp.NewTelegramHandler(bot, playerUseCase)
	telegramHandler.RegisterRoutes(mux)
}
