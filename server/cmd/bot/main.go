package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/joho/godotenv"
	"github.com/tiebetie/TowerTapper/internal/delivery/websocket"
	"github.com/tiebetie/TowerTapper/internal/domain"
	"github.com/tiebetie/TowerTapper/internal/repository/postgres"
	"github.com/tiebetie/TowerTapper/internal/usecase"
	"github.com/tiebetie/TowerTapper/pkg/database"
)

// InvoiceRequest представляет запрос на создание инвойса
type InvoiceRequest struct {
	UserID       int64 `json:"user_id"`
	EmblemAmount int   `json:"emblem_amount"`
	StarCost     int   `json:"star_cost"`
}

// InvoiceResponse представляет ответ с созданным инвойсом
type InvoiceResponse struct {
	InvoiceLink string `json:"invoice_link"`
}

func main() {
	// Configure logging to output to stdout/stderr
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)

	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	var playerUseCase *usecase.PlayerUseCase

	// Проверяем переменную окружения для тестового режима
	if os.Getenv("TEST_MODE") == "true" {
		log.Println("Running in test mode without database")
		playerUseCase = usecase.NewMockPlayerUseCase()
	} else {
		// Инициализация базы данных
		dbConfig := database.Config{
			Host:     os.Getenv("DB_HOST"),
			Port:     os.Getenv("DB_PORT"),
			User:     os.Getenv("DB_USER"),
			Password: os.Getenv("DB_PASSWORD"),
			DBName:   os.Getenv("DB_NAME"),
		}

		var db *sql.DB
		var err error
		maxRetries := 5
		for i := 0; i < maxRetries; i++ {
			db, err = database.NewPostgresDB(dbConfig)
			if err == nil {
				break
			}
			log.Printf("Failed to connect to database, attempt %d/%d: %v", i+1, maxRetries, err)
			time.Sleep(time.Second * 5)
		}
		if err != nil {
			log.Panic(err)
		}
		defer db.Close()

		// Создание таблиц
		if err := database.CreateTables(db); err != nil {
			log.Panic(err)
		}

		// Инициализация репозитория и use case
		repo := postgres.NewPostgresRepository(db)
		playerUseCase = usecase.NewPlayerUseCase(repo)
	}

	// Инициализация Telegram бота
	bot, err := tgbotapi.NewBotAPI(os.Getenv("BOT_TOKEN"))
	if err != nil {
		log.Panic(err)
	}

	bot.Debug = true
	log.Printf("Authorized on account %s", bot.Self.UserName)

	// Настройка веб-хуков (оставляем простой комментарий)
	log.Printf("=== DEBUG === Для настройки вебхука используйте Bot API напрямую с URL: %s", os.Getenv("WEBHOOK_URL"))

	// Инициализация WebSocket хендлера
	wsHandler := websocket.NewHandler(playerUseCase)
	http.HandleFunc("/ws", wsHandler.HandleWebSocket)

	// Обработчик для создания инвойса
	http.HandleFunc("/api/create-invoice", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Получен запрос на создание инвойса: %s %s", r.Method, r.URL.String())

		if r.Method != http.MethodPost {
			log.Printf("=== ERROR === Неправильный метод запроса: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Настройка CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Обработка OPTIONS запроса (preflight)
		if r.Method == http.MethodOptions {
			log.Printf("=== DEBUG === Обработка preflight OPTIONS запроса")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Декодирование JSON запроса
		var req InvoiceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("=== ERROR === Ошибка декодирования JSON: %v", err)
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		log.Printf("=== DEBUG === Данные запроса: UserID=%d, EmblemAmount=%d, StarCost=%d",
			req.UserID, req.EmblemAmount, req.StarCost)

		// Проверка данных
		if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
			log.Printf("=== ERROR === Неверные параметры запроса: UserID=%d, EmblemAmount=%d, StarCost=%d",
				req.UserID, req.EmblemAmount, req.StarCost)
			http.Error(w, "Invalid request parameters", http.StatusBadRequest)
			return
		}

		// Формирование URL для оплаты через Deep Link Bot API
		// В реальном приложении здесь должен быть код создания счета через Bot API
		// Для тестирования используем прямую ссылку
		botUsername := bot.Self.UserName
		startParam := fmt.Sprintf("buy_emblems_%d_%d", req.EmblemAmount, req.StarCost)
		invoiceLink := fmt.Sprintf("tg://resolve?domain=%s&start=%s", botUsername, startParam)

		// Для логирования:
		log.Printf("=== DEBUG === Создана ссылка для оплаты: %s", invoiceLink)
		log.Printf("=== DEBUG === Данные пользователя: UserID=%d, Emblems=%d, Stars=%d",
			req.UserID, req.EmblemAmount, req.StarCost)

		// Отправка ответа
		resp := InvoiceResponse{
			InvoiceLink: invoiceLink,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("=== ERROR === Ошибка кодирования ответа: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Ответ успешно отправлен клиенту")
	})

	// Обработчик для webhook от Telegram
	http.HandleFunc("/webhook", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Получен webhook от Telegram: %s %s", r.Method, r.URL.String())

		update, err := bot.HandleUpdate(r)
		if err != nil {
			log.Printf("=== ERROR === Ошибка обработки webhook: %v", err)
			return
		}

		// Обработка команды /start
		if update.Message != nil && update.Message.IsCommand() && update.Message.Command() == "start" {
			log.Printf("=== DEBUG === Получена команда /start от пользователя %s (ID: %d)",
				update.Message.From.UserName, update.Message.From.ID)

			// Проверяем наличие параметров для глубоких ссылок
			startArgs := update.Message.CommandArguments()

			// Если есть параметры (для покупки), обрабатываем их
			if strings.HasPrefix(startArgs, "buy_emblems_") {
				log.Printf("=== DEBUG === Получены параметры для покупки эмблем: %s", startArgs)
				// Логика покупки эмблем обрабатывается в другом месте
			} else {
				// Если нет параметров, показываем статистику
				handleStartCommand(bot, *update, playerUseCase)
			}

			return
		}

		// Обработка pre-checkout запроса
		if update.PreCheckoutQuery != nil {
			log.Printf("=== DEBUG === Получен pre-checkout запрос: ID=%s", update.PreCheckoutQuery.ID)

			preCheckoutConfig := tgbotapi.PreCheckoutConfig{
				PreCheckoutQueryID: update.PreCheckoutQuery.ID,
				OK:                 true,
			}
			if _, err := bot.Request(preCheckoutConfig); err != nil {
				log.Printf("=== ERROR === Ошибка одобрения pre-checkout запроса: %v", err)
			} else {
				log.Printf("=== DEBUG === Pre-checkout запрос успешно одобрен")
			}
		}

		// Обработка успешного платежа
		if update.Message != nil && update.Message.SuccessfulPayment != nil {
			payment := update.Message.SuccessfulPayment
			payload := payment.InvoicePayload

			log.Printf("=== DEBUG === Получено уведомление об успешном платеже: Payload=%s, TotalAmount=%d",
				payload, payment.TotalAmount)

			// Разбор payload (например, "user_123456789_emblems_100")
			// Формат: user_{user_id}_emblems_{amount}
			userIDStr := ""
			emblemAmount := 0

			// Простой парсер payload
			parts := strings.Split(payload, "_")
			if len(parts) >= 4 && parts[0] == "user" && parts[2] == "emblems" {
				userIDStr = parts[1]
				emblemAmount, _ = strconv.Atoi(parts[3])
				log.Printf("=== DEBUG === Данные платежа: UserID=%s, EmblemAmount=%d", userIDStr, emblemAmount)
			} else {
				log.Printf("=== ERROR === Неверный формат payload: %s", payload)
			}

			if userIDStr != "" && emblemAmount > 0 {
				userID, err := strconv.ParseInt(userIDStr, 10, 64)
				if err != nil {
					log.Printf("=== ERROR === Ошибка при парсинге ID пользователя: %v", err)
					return
				}

				// Выдача эмблем пользователю
				log.Printf("=== DEBUG === Начало обновления баланса эмблем для пользователя %d на %d эмблем",
					userID, emblemAmount)

				err = playerUseCase.AddPlayerEmblems(userID, int64(emblemAmount))
				if err != nil {
					log.Printf("=== ERROR === Ошибка обновления баланса эмблем: %v", err)
					return
				}

				log.Printf("=== DEBUG === Баланс эмблем успешно обновлен")

				// Получаем обновленные данные игрока для сообщения
				updatedPlayer, err := playerUseCase.GetPlayerData(userID)
				if err != nil {
					log.Printf("=== ERROR === Ошибка получения данных игрока: %v", err)
					return
				}

				log.Printf("=== DEBUG === Обновленный баланс пользователя: %d эмблем", updatedPlayer.Emblems)

				// Отправляем сообщение об успешной покупке
				msgText := fmt.Sprintf("Successfully purchased %d emblems! Your new balance: %d emblems.",
					emblemAmount, updatedPlayer.Emblems)
				log.Printf("=== DEBUG === Отправка сообщения пользователю: %s", msgText)

				msg := tgbotapi.NewMessage(update.Message.Chat.ID, msgText)
				if _, err := bot.Send(msg); err != nil {
					log.Printf("=== ERROR === Ошибка отправки сообщения: %v", err)
				} else {
					log.Printf("=== DEBUG === Сообщение успешно отправлено")
				}
			} else {
				log.Printf("=== ERROR === Недостаточно данных для обработки платежа: UserID=%s, EmblemAmount=%d",
					userIDStr, emblemAmount)
			}
		}
	})

	// Обработчик для процессинга покупок через Stars API
	http.HandleFunc("/api/process-purchase", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Получен запрос на процессинг прямой покупки Stars: %s %s", r.Method, r.URL.String())

		if r.Method != http.MethodPost {
			log.Printf("=== ERROR === Неправильный метод запроса: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Настройка CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Обработка OPTIONS запроса (preflight)
		if r.Method == http.MethodOptions {
			log.Printf("=== DEBUG === Обработка preflight OPTIONS запроса")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Структура для получения данных о покупке
		type PurchaseRequest struct {
			UserID         int64  `json:"user_id"`
			EmblemAmount   int    `json:"emblem_amount"`
			StarCost       int    `json:"star_cost"`
			PurchaseSource string `json:"purchase_source"`
			Timestamp      int64  `json:"timestamp"`
		}

		// Структура для ответа
		type PurchaseResponse struct {
			Success    bool   `json:"success"`
			NewBalance int64  `json:"new_balance"`
			Message    string `json:"message"`
		}

		// Декодирование JSON запроса
		var req PurchaseRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("=== ERROR === Ошибка декодирования JSON: %v", err)
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		log.Printf("=== DEBUG === Данные запроса покупки: UserID=%d, EmblemAmount=%d, StarCost=%d, Source=%s",
			req.UserID, req.EmblemAmount, req.StarCost, req.PurchaseSource)

		// Проверка данных
		if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
			log.Printf("=== ERROR === Неверные параметры запроса: UserID=%d, EmblemAmount=%d, StarCost=%d",
				req.UserID, req.EmblemAmount, req.StarCost)
			http.Error(w, "Invalid request parameters", http.StatusBadRequest)
			return
		}

		// Добавляем эмблемы пользователю
		log.Printf("=== DEBUG === Добавляем %d эмблем пользователю %d", req.EmblemAmount, req.UserID)

		// Конвертируем эмблемы в int64
		emblemAmount := int64(req.EmblemAmount)

		err := playerUseCase.AddPlayerEmblems(req.UserID, emblemAmount)
		if err != nil {
			log.Printf("=== ERROR === Ошибка добавления эмблем: %v", err)
			http.Error(w, fmt.Sprintf("Failed to add emblems: %v", err), http.StatusInternalServerError)
			return
		}

		// Получаем обновленные данные игрока
		player, err := playerUseCase.GetPlayerData(req.UserID)
		if err != nil {
			log.Printf("=== ERROR === Ошибка получения данных игрока: %v", err)
			http.Error(w, fmt.Sprintf("Failed to get player data: %v", err), http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Успешно добавлены эмблемы. Новый баланс: %d", player.Emblems)

		// Отправка ответа
		resp := PurchaseResponse{
			Success:    true,
			NewBalance: player.Emblems,
			Message:    fmt.Sprintf("Successfully added %d emblems", req.EmblemAmount),
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("=== ERROR === Ошибка кодирования ответа: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Ответ успешно отправлен клиенту")
	})

	// Запуск HTTP сервера
	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}
	addr := fmt.Sprintf("0.0.0.0:%s", serverPort)
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Server error: %v", err)
	}
}

// Обработчик команды старт для телеграм-бота
func handleStartCommand(bot *tgbotapi.BotAPI, update tgbotapi.Update, playerUseCase *usecase.PlayerUseCase) {
	// Регистрация игрока
	player, err := playerUseCase.RegisterPlayer(
		update.Message.From.ID,
		update.Message.From.UserName,
	)
	if err != nil {
		log.Printf("Error registering player: %v", err)
		return
	}

	// Карта соответствия типов навыков и эмодзи/имен
	skillTypeMap := map[string]struct {
		Name  string
		Emoji string
	}{
		"MAX_HEALTH":       {"Прочность замка", "🏰"},
		"DEFENSE":          {"Защита", "🛡️"},
		"HEALTH_REGEN":     {"Регенерация", "💖"},
		"DAMAGE":           {"Урон", "🔥"},
		"COIN_REWARD":      {"Золотой бонус", "💰"},
		"ATTACK_SPEED":     {"Скорость атаки", "⚡"},
		"ATTACK_RANGE":     {"Дальность атаки", "🎯"},
		"MULTISHOT":        {"Мультивыстрел", "🏹"},
		"CRIT_CHANCE":      {"Шанс крита", "✨"},
		"CRIT_MULTIPLIER":  {"Множитель крита", "💥"},
		"KNOCKBACK":        {"Отбрасывание", "👊"},
		"LIFESTEAL_CHANCE": {"Шанс вампиризма", "🧛"},
		"LIFESTEAL_AMOUNT": {"Количество вампиризма", "💉"},
		"DAILY_GOLD":       {"Ежедневное золото", "🪙"},
		"EMBLEM_BONUS":     {"Бонус эмблем", "🎖️"},
		"FREE_UPGRADE":     {"Шанс бесплатного улучшения", "🎁"},
		"SUPPLY_DROP":      {"Шанс сундука", "📦"},
		"GAME_SPEED":       {"Скорость игры", "⏩"},
	}

	welcomeMsg := "🎮 *Tower Tapper - Статистика игрока* 🎮\n\n"
	welcomeMsg += fmt.Sprintf("👤 *Игрок:* %s\n", update.Message.From.UserName)
	welcomeMsg += fmt.Sprintf("💎 *Эмблемы:* %d\n", player.Emblems)

	// Получаем навыки игрока, если они есть
	skills, err := playerUseCase.GetPlayerSkills(update.Message.From.ID)
	if err != nil {
		log.Printf("Error getting player skills: %v", err)
	} else if len(skills) > 0 {
		welcomeMsg += "\n📊 *Постоянные навыки:*\n"

		// Сортируем навыки по категориям
		var attackSkills, defenseSkills, utilitySkills []*domain.PlayerSkill

		for _, skill := range skills {
			skillType := skill.SkillType

			switch skillType {
			case "DAMAGE", "ATTACK_SPEED", "ATTACK_RANGE", "MULTISHOT", "CRIT_CHANCE", "CRIT_MULTIPLIER":
				attackSkills = append(attackSkills, skill)
			case "MAX_HEALTH", "DEFENSE", "HEALTH_REGEN", "KNOCKBACK", "LIFESTEAL_AMOUNT", "LIFESTEAL_CHANCE":
				defenseSkills = append(defenseSkills, skill)
			default:
				utilitySkills = append(utilitySkills, skill)
			}
		}

		// Отображаем навыки атаки
		if len(attackSkills) > 0 {
			welcomeMsg += "\n🗡️ *Навыки атаки:*\n"
			for _, skill := range attackSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Ур. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Ур. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Отображаем навыки защиты
		if len(defenseSkills) > 0 {
			welcomeMsg += "\n🛡️ *Навыки защиты:*\n"
			for _, skill := range defenseSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Ур. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Ур. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Отображаем полезные навыки
		if len(utilitySkills) > 0 {
			welcomeMsg += "\n🧩 *Полезные навыки:*\n"
			for _, skill := range utilitySkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Ур. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Ур. %d\n", skill.SkillType, skill.Level)
				}
			}
		}
	} else {
		welcomeMsg += "\n👉 У вас пока нет постоянных навыков. Играйте и улучшайте свои навыки!"
	}

	msg := tgbotapi.NewMessage(update.Message.Chat.ID, welcomeMsg)
	msg.ParseMode = "Markdown"

	clientURL := os.Getenv("CLIENT_URL")
	fullGameURL := fmt.Sprintf("http://%s?telegram_id=%d", clientURL, update.Message.From.ID)
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonURL("🎮 Играть Tower Tapper", fullGameURL),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonURL("💎 Купить эмблемы", fullGameURL+"&shop=true"),
		),
	)

	msg.ReplyMarkup = keyboard

	if _, err := bot.Send(msg); err != nil {
		log.Printf("Error sending message: %v", err)
	}
}
