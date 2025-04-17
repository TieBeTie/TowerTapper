package usecase

import (
	"github.com/tiebetie/TowerTapper/internal/domain"
)

type PlayerUseCase struct {
	repo domain.Repository
}

func NewPlayerUseCase(repo domain.Repository) *PlayerUseCase {
	return &PlayerUseCase{
		repo: repo,
	}
}

func (uc *PlayerUseCase) RegisterPlayer(telegramID int64, username string) (*domain.Player, error) {
	// Проверяем, существует ли игрок
	existingPlayer, err := uc.repo.GetPlayerByTelegramID(telegramID)
	if err != nil {
		return nil, err
	}

	if existingPlayer != nil {
		return existingPlayer, nil
	}

	// Создаем нового игрока
	player := &domain.Player{
		TelegramID: telegramID,
		Username:   username,
		Emblems:    0, // Начальное количество эмблем
	}

	err = uc.repo.CreatePlayer(player)
	if err != nil {
		return nil, err
	}

	return player, nil
}

func (uc *PlayerUseCase) GetPlayerData(telegramID int64) (*domain.Player, error) {
	player, err := uc.repo.GetPlayerByTelegramID(telegramID)
	if err != nil {
		return nil, err
	}

	if player == nil {
		return nil, nil
	}

	return player, nil
}

func (uc *PlayerUseCase) UpdatePlayerEmblems(playerID int64, emblems int64) error {
	player, err := uc.repo.GetPlayerByTelegramID(playerID)
	if err != nil {
		return err
	}

	player.Emblems = emblems
	return uc.repo.UpdatePlayer(player)
}

func (uc *PlayerUseCase) AddPlayerEmblems(playerID int64, amount int64) error {
	player, err := uc.repo.GetPlayerByTelegramID(playerID)
	if err != nil {
		return err
	}

	player.Emblems += amount
	return uc.repo.UpdatePlayer(player)
}

func (uc *PlayerUseCase) GetPlayerSkills(playerID int64) ([]*domain.PlayerSkill, error) {
	player, err := uc.repo.GetPlayerByTelegramID(playerID)
	if err != nil {
		return nil, err
	}

	if player == nil {
		return nil, nil
	}

	return uc.repo.GetPlayerSkills(player.ID)
}

func (uc *PlayerUseCase) SavePlayerSkill(telegramID int64, skillType string, level int) error {
	player, err := uc.repo.GetPlayerByTelegramID(telegramID)
	if err != nil {
		return err
	}

	if player == nil {
		return nil
	}

	skill := &domain.PlayerSkill{
		PlayerID:  player.ID,
		SkillType: skillType,
		Level:     level,
	}

	return uc.repo.SavePlayerSkill(skill)
}

func (uc *PlayerUseCase) GetTopPlayersByMaxWave(limit int) ([]*domain.Player, error) {
	return uc.repo.GetTopPlayersByMaxWave(limit)
}

func (uc *PlayerUseCase) GetPlayerRankByMaxWave(telegramID int64) (int, error) {
	return uc.repo.GetPlayerRankByMaxWave(telegramID)
}

func (uc *PlayerUseCase) UpdatePlayer(player *domain.Player) error {
	return uc.repo.UpdatePlayer(player)
}
