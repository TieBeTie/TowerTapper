package websocket

import (
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // В продакшене нужно настроить проверку origin
	},
}

type Handler struct {
	playerUseCase *usecase.PlayerUseCase
	clients       map[int64]*websocket.Conn
	mutex         sync.RWMutex
}

func NewHandler(playerUseCase *usecase.PlayerUseCase) *Handler {
	return &Handler{
		playerUseCase: playerUseCase,
		clients:       make(map[int64]*websocket.Conn),
	}
}

type GameState struct {
	Castle struct {
		Level       int     `json:"level"`
		Health      int     `json:"health"`
		ArrowSpeed  float64 `json:"arrow_speed"`
		ArrowDamage int     `json:"arrow_damage"`
	} `json:"castle"`
	Gold int64 `json:"gold"`
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to websocket: %v", err)
		return
	}

	// Получаем telegram_id из query параметров
	telegramIDStr := r.URL.Query().Get("telegram_id")
	if telegramIDStr == "" {
		log.Printf("No telegram_id provided")
		conn.Close()
		return
	}

	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		log.Printf("Invalid telegram_id: %v", err)
		conn.Close()
		return
	}

	// Получаем начальное состояние игры
	player, castle, err := h.playerUseCase.GetPlayerData(telegramID)
	if err != nil {
		log.Printf("Error getting player data: %v", err)
		conn.Close()
		return
	}

	// Отправляем начальное состояние
	initialState := GameState{}
	initialState.Castle.Level = castle.Level
	initialState.Castle.Health = castle.Health
	initialState.Castle.ArrowSpeed = castle.ArrowSpeed
	initialState.Castle.ArrowDamage = castle.ArrowDamage
	initialState.Gold = player.Gold

	if err := conn.WriteJSON(Message{
		Type:    "initial_state",
		Payload: initialState,
	}); err != nil {
		log.Printf("Error sending initial state: %v", err)
		conn.Close()
		return
	}

	// Сохраняем соединение
	h.mutex.Lock()
	h.clients[telegramID] = conn
	h.mutex.Unlock()

	// Очистка при закрытии соединения
	defer func() {
		h.mutex.Lock()
		delete(h.clients, telegramID)
		h.mutex.Unlock()
		conn.Close()
	}()

	// Бесконечный цикл чтения сообщений
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		// Обработка различных типов сообщений
		switch msg.Type {
		case "click":
			// Отправляем подтверждение клика
			if err := conn.WriteJSON(Message{
				Type: "click_confirmed",
			}); err != nil {
				log.Printf("Error sending click confirmation: %v", err)
			}

		case "enemy_killed":
			// Обновляем монеты
			if gold, ok := msg.Payload.(float64); ok {
				err := h.playerUseCase.UpdatePlayerGold(telegramID, int64(gold))
				if err != nil {
					log.Printf("Error updating gold: %v", err)
				}
			}

		case "castle_damaged":
			// Обновляем здоровье замка
			if health, ok := msg.Payload.(float64); ok {
				castle.Health = int(health)
				if err := h.playerUseCase.UpdateCastle(castle); err != nil {
					log.Printf("Error updating castle health: %v", err)
				}
			}
		}
	}
}
