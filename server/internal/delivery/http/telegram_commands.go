package http

import (
	"fmt"
	"log"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/tiebetie/TowerTapper/internal/domain"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

// TelegramCommandHandler обрабатывает команды Telegram бота
type TelegramCommandHandler struct {
	bot           *tgbotapi.BotAPI
	playerUseCase *usecase.PlayerUseCase
}

// NewTelegramCommandHandler создает новый обработчик команд
func NewTelegramCommandHandler(bot *tgbotapi.BotAPI, playerUseCase *usecase.PlayerUseCase) *TelegramCommandHandler {
	return &TelegramCommandHandler{
		bot:           bot,
		playerUseCase: playerUseCase,
	}
}

// HandleCommand обрабатывает команды Telegram бота
func (h *TelegramCommandHandler) HandleCommand(update tgbotapi.Update) {
	if update.Message == nil {
		return
	}

	// Проверяем, является ли сообщение командой
	if !update.Message.IsCommand() {
		return
	}

	// Определяем, какая команда вызвана
	switch update.Message.Command() {
	case "start":
		h.handleStartCommand(update)
	case "paysupport":
		h.handlePaySupportCommand(update)
	case "help":
		h.handleHelpCommand(update)
	default:
		log.Printf("=== DEBUG === Unknown command: %s", update.Message.Command())
	}
}

// handleStartCommand обрабатывает команду /start
func (h *TelegramCommandHandler) handleStartCommand(update tgbotapi.Update) {
	log.Printf("=== DEBUG === Processing /start command for user %s (ID: %d)", update.Message.From.UserName, update.Message.From.ID)

	// Получаем или создаем данные игрока
	player, err := h.playerUseCase.GetPlayerData(update.Message.From.ID)
	if err != nil {
		log.Printf("=== ERROR === Error getting player data: %v", err)
		return
	}

	// Если игрок не существует, создаем его
	if player == nil {
		player, err = h.playerUseCase.RegisterPlayer(update.Message.From.ID, update.Message.From.UserName)
		if err != nil {
			log.Printf("=== ERROR === Error registering player: %v", err)
			return
		}
	}

	// Map of skill types to emoji/names
	skillTypeMap := map[string]struct {
		Name  string
		Emoji string
	}{
		"MAX_HEALTH":       {"Castle Strength", "🏰"},
		"DEFENSE":          {"Defense", "🛡️"},
		"HEALTH_REGEN":     {"Regeneration", "💖"},
		"DAMAGE":           {"Damage", "🔥"},
		"COIN_REWARD":      {"Gold Bonus", "💰"},
		"ATTACK_SPEED":     {"Attack Speed", "⚡"},
		"ATTACK_RANGE":     {"Attack Range", "🎯"},
		"MULTISHOT":        {"Multishot", "🏹"},
		"CRIT_CHANCE":      {"Crit Chance", "✨"},
		"CRIT_MULTIPLIER":  {"Crit Multiplier", "💥"},
		"KNOCKBACK":        {"Knockback", "👊"},
		"LIFESTEAL_CHANCE": {"Lifesteal Chance", "🧛"},
		"LIFESTEAL_AMOUNT": {"Lifesteal Amount", "💉"},
		"EMBLEM_BONUS":     {"Emblem Bonus", "🎖️"},
		"FREE_UPGRADE":     {"Free Upgrade Chance", "🎁"},
		"SUPPLY_DROP":      {"Chest Chance", "📦"},
		"GAME_SPEED":       {"Game Speed", "⏩"},
		"WAVE_BONUS":       {"Wave Bonus", "🌊"},
	}

	welcomeMsg := "🎮 *Tower Tapper - Player Statistics* 🎮\n\n"
	welcomeMsg += fmt.Sprintf("👤 *Player:* %s\n", update.Message.From.UserName)
	welcomeMsg += fmt.Sprintf("💎 *Emblems:* %d\n", player.Emblems)

	// Getting player skills if they exist
	skills, err := h.playerUseCase.GetPlayerSkills(update.Message.From.ID)
	if err != nil {
		log.Printf("Error getting player skills: %v", err)
	} else if len(skills) > 0 {
		welcomeMsg += "\n📊 *Initial Skills:*\n"

		// Sorting skills by categories
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

		// Displaying attack skills
		if len(attackSkills) > 0 {
			welcomeMsg += "\n🗡️ *Attack Skills:*\n"
			for _, skill := range attackSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Displaying defense skills
		if len(defenseSkills) > 0 {
			welcomeMsg += "\n🛡️ *Defense Skills:*\n"
			for _, skill := range defenseSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Displaying utility skills
		if len(utilitySkills) > 0 {
			welcomeMsg += "\n🧩 *Utility Skills:*\n"
			for _, skill := range utilitySkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}
	} else {
		welcomeMsg += "\n👉 You don't have any Initial skills yet. Play and upgrade your skills!"
	}

	msg := tgbotapi.NewMessage(update.Message.Chat.ID, welcomeMsg)
	msg.ParseMode = "Markdown"

	if _, err := h.bot.Send(msg); err != nil {
		log.Printf("Error sending message: %v", err)
	}
}

// handleHelpCommand обрабатывает команду /help
func (h *TelegramCommandHandler) handleHelpCommand(update tgbotapi.Update) {
	chatID := update.Message.Chat.ID
	log.Printf("=== DEBUG === Processing /help command for user %s (ID: %d)", update.Message.From.UserName, update.Message.From.ID)

	// Формируем сообщение с описанием доступных команд
	helpMsg := "🎮 *Tower Tapper - Доступные команды* 🎮\n\n"
	helpMsg += "/start - Показать статистику игрока и текущие навыки\n"
	helpMsg += "/paysupport - Обратиться в поддержку по вопросам платежей\n"
	helpMsg += "/help - Показать список доступных команд\n"

	// Создаем и отправляем сообщение
	msg := tgbotapi.NewMessage(chatID, helpMsg)
	msg.ParseMode = "Markdown"

	if _, err := h.bot.Send(msg); err != nil {
		log.Printf("=== ERROR === Error sending help message: %v", err)
	} else {
		log.Printf("=== DEBUG === Help message sent successfully to user %d", update.Message.From.ID)
	}
}

// handlePaySupportCommand обрабатывает команду /paysupport
func (h *TelegramCommandHandler) handlePaySupportCommand(update tgbotapi.Update) {
	chatID := update.Message.Chat.ID
	userID := update.Message.From.ID
	username := update.Message.From.UserName

	log.Printf("=== DEBUG === Processing /paysupport command for user %s (ID: %d)", username, userID)

	// Формируем приветственное сообщение для поддержки платежей
	supportMsg := "🛒 *Tower Tapper - Payment Support* 🛒\n\n"
	supportMsg += "Welcome to our payment support. If you have any issues with your purchases, please describe the problem below.\n\n"
	supportMsg += "Please include the following information:\n"
	supportMsg += "- When did you make the purchase?\n"
	supportMsg += "- How many Stars/Emblems were involved?\n"
	supportMsg += "- What happened instead of the expected result?\n\n"
	supportMsg += "Our support team will get back to you as soon as possible."

	// Создаем и отправляем сообщение
	msg := tgbotapi.NewMessage(chatID, supportMsg)
	msg.ParseMode = "Markdown"

	// Добавляем кнопку для возврата
	msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔄 Request Refund", fmt.Sprintf("refund_request_%d", userID)),
		),
	)

	if _, err := h.bot.Send(msg); err != nil {
		log.Printf("=== ERROR === Error sending payment support message: %v", err)
	} else {
		log.Printf("=== DEBUG === Payment support message sent successfully to user %d", userID)
	}
}
