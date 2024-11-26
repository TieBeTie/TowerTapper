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
		Coins:      0, // Начальное количество монет
	}

	err = uc.repo.CreatePlayer(player)
	if err != nil {
		return nil, err
	}

	// Создаем начальный замок для игрока
	castle := &domain.Castle{
		PlayerID:    player.ID,
		Level:       1,
		Health:      100,
		ArrowSpeed:  1.0,
		ArrowDamage: 1,
	}

	err = uc.repo.CreateCastle(castle)
	if err != nil {
		return nil, err
	}

	return player, nil
}

func (uc *PlayerUseCase) GetPlayerData(telegramID int64) (*domain.Player, *domain.Castle, error) {
	player, err := uc.repo.GetPlayerByTelegramID(telegramID)
	if err != nil {
		return nil, nil, err
	}

	if player == nil {
		return nil, nil, nil
	}

	castle, err := uc.repo.GetCastleByPlayerID(player.ID)
	if err != nil {
		return nil, nil, err
	}

	return player, castle, nil
}

func (uc *PlayerUseCase) UpdatePlayerCoins(playerID int64, coins int64) error {
	player, err := uc.repo.GetPlayerByTelegramID(playerID)
	if err != nil {
		return err
	}

	player.Coins = coins
	return uc.repo.UpdatePlayer(player)
}

func (uc *PlayerUseCase) UpdateCastle(castle *domain.Castle) error {
	return uc.repo.UpdateCastle(castle)
}
