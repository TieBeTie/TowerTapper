package handlers

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/tiebetie/TowerTapper/internal/services"
)

func GameHandler(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		// Allow connections from any origin for development purposes.
		// For production, implement proper origin checks.
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		http.Error(w, "Failed to upgrade to WebSocket", http.StatusInternalServerError)
		return
	}

	gameService := services.NewGameService()
	go gameService.HandlePlayerConnection(conn) // Run in a separate goroutine
}
