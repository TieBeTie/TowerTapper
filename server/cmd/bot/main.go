package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/joho/godotenv"
	"github.com/tiebetie/TowerTapper/internal/delivery/websocket"
	"github.com/tiebetie/TowerTapper/internal/repository/postgres"
	"github.com/tiebetie/TowerTapper/internal/usecase"
	"github.com/tiebetie/TowerTapper/pkg/database"
)

func main() {
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

	// Инициализация WebSocket хендлера
	wsHandler := websocket.NewHandler(playerUseCase)
	http.HandleFunc("/ws", wsHandler.HandleWebSocket)

	// Запуск HTTP сервера в отдельной горутине
	go func() {
		serverPort := os.Getenv("SERVER_PORT")
		if serverPort == "" {
			serverPort = "8080"
		}
		addr := fmt.Sprintf("0.0.0.0:%s", serverPort)
		log.Printf("Starting WebSocket server on %s", addr)
		if err := http.ListenAndServe(addr, nil); err != nil {
			log.Printf("WebSocket server error: %v", err)
		}
	}()

	bot, err := tgbotapi.NewBotAPI(os.Getenv("BOT_TOKEN"))
	if err != nil {
		log.Panic(err)
	}

	bot.Debug = true
	log.Printf("Authorized on account %s", bot.Self.UserName)

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := bot.GetUpdatesChan(u)

	for update := range updates {
		if update.Message == nil {
			continue
		}

		if update.Message.Command() == "start" {
			// Регистрация игрока
			player, err := playerUseCase.RegisterPlayer(
				update.Message.From.ID,
				update.Message.From.UserName,
			)
			if err != nil {
				log.Printf("Error registering player: %v", err)
				continue
			}

			welcomeMsg := "Welcome to Tower Tapper!\n\n"
			welcomeMsg += fmt.Sprintf("Emblems: %d\n", player.Emblems)

			// Получаем навыки игрока, если они есть
			skills, err := playerUseCase.GetPlayerSkills(update.Message.From.ID)
			if err != nil {
				log.Printf("Error getting player skills: %v", err)
			} else if len(skills) > 0 {
				welcomeMsg += "\nYour permanent skills:\n"
				for _, skill := range skills {
					welcomeMsg += fmt.Sprintf("%s: Level %d\n", skill.SkillType, skill.Level)
				}
			}

			msg := tgbotapi.NewMessage(update.Message.Chat.ID, welcomeMsg)

			clientURL := os.Getenv("CLIENT_URL")
			fullGameURL := fmt.Sprintf("http://%s?telegram_id=%d", clientURL, update.Message.From.ID)
			keyboard := tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonURL("Play Tower Tapper", fullGameURL),
				),
			)

			msg.ReplyMarkup = keyboard

			if _, err := bot.Send(msg); err != nil {
				log.Printf("Error sending message: %v", err)
			}
		}
	}
}
