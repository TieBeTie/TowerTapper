package usecase

import (
	"sync"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type MockPlayerUseCase struct {
	players map[int64]*domain.Player
	castles map[int64]*domain.Castle
	mutex   sync.RWMutex
}

func NewMockPlayerUseCase() *PlayerUseCase {
	mock := &MockPlayerUseCase{
		players: make(map[int64]*domain.Player),
		castles: make(map[int64]*domain.Castle),
	}
	return &PlayerUseCase{repo: mock}
}

func (m *MockPlayerUseCase) CreatePlayer(player *domain.Player) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	player.ID = int64(len(m.players) + 1)
	m.players[player.TelegramID] = player
	return nil
}

func (m *MockPlayerUseCase) GetPlayerByTelegramID(telegramID int64) (*domain.Player, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if player, ok := m.players[telegramID]; ok {
		return player, nil
	}
	return nil, nil
}

func (m *MockPlayerUseCase) UpdatePlayer(player *domain.Player) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.players[player.TelegramID] = player
	return nil
}

func (m *MockPlayerUseCase) CreateCastle(castle *domain.Castle) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	castle.ID = int64(len(m.castles) + 1)
	m.castles[castle.PlayerID] = castle
	return nil
}

func (m *MockPlayerUseCase) GetCastleByPlayerID(playerID int64) (*domain.Castle, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if castle, ok := m.castles[playerID]; ok {
		return castle, nil
	}

	// В тестовом режиме всегда возвращаем базовый замок
	return &domain.Castle{
		PlayerID:    playerID,
		Level:       1,
		Health:      100,
		ArrowSpeed:  1.0,
		ArrowDamage: 1,
	}, nil
}

func (m *MockPlayerUseCase) UpdateCastle(castle *domain.Castle) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.castles[castle.PlayerID] = castle
	return nil
}
