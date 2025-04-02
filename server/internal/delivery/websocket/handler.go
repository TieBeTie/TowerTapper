package websocket

import (
	"encoding/json"
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

type PlayerSkill struct {
	SkillType string `json:"skill_type"`
	Level     int    `json:"level"`
}

type GameState struct {
	Emblems      int64         `json:"emblems"`
	PlayerSkills []PlayerSkill `json:"player_skills"`
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// HandleWebSocket обрабатывает WebSocket соединения
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Получаем информацию о подключении
	remoteAddr := r.RemoteAddr
	userAgent := r.UserAgent()
	origin := r.Header.Get("Origin")

	// Получаем Telegram ID из query параметра
	telegramIDStr := r.URL.Query().Get("telegram_id")
	if telegramIDStr == "" {
		log.Printf("=== ERROR === WebSocket connection attempt without telegram_id from %s (User-Agent: %s)", remoteAddr, userAgent)
		http.Error(w, "Missing telegram_id parameter", http.StatusBadRequest)
		return
	}

	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		log.Printf("=== ERROR === Invalid telegram_id format: %s from %s (User-Agent: %s)", telegramIDStr, remoteAddr, userAgent)
		http.Error(w, "Invalid telegram_id", http.StatusBadRequest)
		return
	}

	log.Printf("=== INFO === New WebSocket connection attempt from user ID: %d (IP: %s, Origin: %s, User-Agent: %s)",
		telegramID, remoteAddr, origin, userAgent)

	// Устанавливаем WebSocket соединение
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("=== ERROR === Failed to upgrade connection for user %d from %s: %v", telegramID, remoteAddr, err)
		return
	}
	defer conn.Close()

	// Регистрируем клиента
	h.mutex.Lock()
	h.clients[telegramID] = conn
	h.mutex.Unlock()
	log.Printf("=== INFO === User %d successfully connected from %s. Total active connections: %d",
		telegramID, remoteAddr, len(h.clients))

	defer func() {
		h.mutex.Lock()
		delete(h.clients, telegramID)
		h.mutex.Unlock()
		log.Printf("=== INFO === User %d disconnected from %s. Remaining connections: %d",
			telegramID, remoteAddr, len(h.clients))
	}()

	// Получаем данные игрока
	player, err := h.playerUseCase.GetPlayerData(telegramID)
	if err != nil {
		log.Printf("=== ERROR === Failed to get player data for user %d: %v", telegramID, err)
		return
	}

	// Если игрок не существует, создаем его
	if player == nil {
		log.Printf("=== INFO === New player registration for user ID: %d", telegramID)
		player, err = h.playerUseCase.RegisterPlayer(telegramID, "")
		if err != nil {
			log.Printf("=== ERROR === Failed to register new player %d: %v", telegramID, err)
			return
		}

		// Инициализируем базовые навыки для нового игрока
		defaultSkills := []string{"EMBLEM_BONUS"} // Add other default skills here
		for _, skillType := range defaultSkills {
			err = h.playerUseCase.SavePlayerSkill(telegramID, skillType, 1)
			if err != nil {
				log.Printf("=== ERROR === Failed to initialize default skill %s for user %d: %v", skillType, telegramID, err)
			} else {
				log.Printf("=== INFO === Initialized default skill %s for new user %d", skillType, telegramID)
			}
		}
	}

	// Получаем навыки игрока
	skillsData, err := h.playerUseCase.GetPlayerSkills(telegramID)
	if err != nil {
		log.Printf("=== ERROR === Failed to get player skills for user %d: %v", telegramID, err)
		return
	}

	// Преобразуем навыки в формат для отправки
	playerSkills := make([]PlayerSkill, len(skillsData))
	for i, skill := range skillsData {
		playerSkills[i] = PlayerSkill{
			SkillType: skill.SkillType,
			Level:     skill.Level,
		}
	}

	// Отправляем начальное состояние
	initialState := GameState{
		Emblems:      player.Emblems,
		PlayerSkills: playerSkills,
	}

	err = conn.WriteJSON(Message{
		Type:    "initial_state",
		Payload: initialState,
	})
	if err != nil {
		log.Printf("=== ERROR === Failed to send initial state to user %d: %v", telegramID, err)
		return
	}
	log.Printf("=== INFO === Sent initial state to user %d: %d emblems, %d skills", telegramID, player.Emblems, len(playerSkills))

	// Обрабатываем сообщения от клиента
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("=== ERROR === Failed to read message from user %d: %v", telegramID, err)
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("=== ERROR === Failed to unmarshal message from user %d: %v", telegramID, err)
			continue
		}

		log.Printf("=== INFO === Received message type '%s' from user %d", msg.Type, telegramID)

		// Обрабатываем разные типы сообщений
		switch msg.Type {
		case "update_emblems":
			// Получаем новое значение эмблем
			emblemsPayload, ok := msg.Payload.(float64)
			if !ok {
				log.Printf("=== ERROR === Invalid emblems payload from user %d", telegramID)
				continue
			}
			emblems := int64(emblemsPayload)

			// Обновляем количество эмблем у игрока
			err = h.playerUseCase.UpdatePlayerEmblems(telegramID, emblems)
			if err != nil {
				log.Printf("=== ERROR === Failed to update emblems for user %d: %v", telegramID, err)
			} else {
				log.Printf("=== INFO === Updated emblems for user %d to %d", telegramID, emblems)
			}

		case "add_emblems":
			// Получаем количество эмблем для добавления
			emblemsPayload, ok := msg.Payload.(float64)
			if !ok {
				log.Printf("=== ERROR === Invalid emblems payload from user %d", telegramID)
				continue
			}
			emblems := int64(emblemsPayload)

			log.Printf("=== INFO === Adding %d emblems to user %d", emblems, telegramID)

			// Добавляем эмблемы игроку
			err = h.playerUseCase.AddPlayerEmblems(telegramID, emblems)
			if err != nil {
				log.Printf("=== ERROR === Failed to add emblems for user %d: %v", telegramID, err)
			} else {
				// Получаем обновленные данные игрока
				player, err = h.playerUseCase.GetPlayerData(telegramID)
				if err != nil {
					log.Printf("=== ERROR === Failed to get updated player data for user %d: %v", telegramID, err)
					continue
				}
				log.Printf("=== INFO === Successfully added %d emblems to user %d. New balance: %d", emblems, telegramID, player.Emblems)

				// Отправляем обновленное состояние
				currentState := GameState{
					Emblems:      player.Emblems,
					PlayerSkills: playerSkills,
				}

				err = conn.WriteJSON(Message{
					Type:    "game_state",
					Payload: currentState,
				})
				if err != nil {
					log.Printf("=== ERROR === Failed to send updated state to user %d: %v", telegramID, err)
				} else {
					log.Printf("=== INFO === Sent updated state to user %d after adding emblems", telegramID)
				}
			}

		case "update_skill":
			// Парсим данные навыка
			var skillData struct {
				SkillType string `json:"skill_type"`
				Level     int    `json:"level"`
			}

			payloadBytes, err := json.Marshal(msg.Payload)
			if err != nil {
				log.Printf("=== ERROR === Failed to marshal skill payload for user %d: %v", telegramID, err)
				continue
			}

			if err := json.Unmarshal(payloadBytes, &skillData); err != nil {
				log.Printf("=== ERROR === Failed to unmarshal skill data for user %d: %v", telegramID, err)
				continue
			}

			log.Printf("=== INFO === Updating skill %s to level %d for user %d", skillData.SkillType, skillData.Level, telegramID)

			// Сохраняем навык игрока
			err = h.playerUseCase.SavePlayerSkill(telegramID, skillData.SkillType, skillData.Level)
			if err != nil {
				log.Printf("=== ERROR === Failed to save player skill for user %d: %v", telegramID, err)
				continue
			}

			// Получаем обновленные навыки
			skillsData, err := h.playerUseCase.GetPlayerSkills(telegramID)
			if err != nil {
				log.Printf("=== ERROR === Failed to get updated player skills for user %d: %v", telegramID, err)
				continue
			}

			// Обновляем список навыков
			playerSkills = make([]PlayerSkill, len(skillsData))
			for i, skill := range skillsData {
				playerSkills[i] = PlayerSkill{
					SkillType: skill.SkillType,
					Level:     skill.Level,
				}
			}

			// Отправляем обновленное состояние
			currentState := GameState{
				Emblems:      player.Emblems,
				PlayerSkills: playerSkills,
			}

			err = conn.WriteJSON(Message{
				Type:    "game_state",
				Payload: currentState,
			})
			if err != nil {
				log.Printf("=== ERROR === Failed to send updated state to user %d: %v", telegramID, err)
			} else {
				log.Printf("=== INFO === Successfully updated skill %s to level %d for user %d", skillData.SkillType, skillData.Level, telegramID)
			}
		}
	}
}
