package usecase

import (
	"sync"
	"time"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type MockPlayerUseCase struct {
	players  map[int64]*domain.Player
	skills   map[int64][]*domain.PlayerSkill
	payments map[int64]*domain.Payment
	lastID   int64
	mutex    sync.RWMutex
}

func NewMockPlayerUseCase() *PlayerUseCase {
	mock := &MockPlayerUseCase{
		players:  make(map[int64]*domain.Player),
		skills:   make(map[int64][]*domain.PlayerSkill),
		payments: make(map[int64]*domain.Payment),
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

func (m *MockPlayerUseCase) GetPlayerSkills(playerID int64) ([]*domain.PlayerSkill, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if skills, ok := m.skills[playerID]; ok {
		return skills, nil
	}
	return []*domain.PlayerSkill{}, nil
}

func (m *MockPlayerUseCase) SavePlayerSkill(skill *domain.PlayerSkill) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	skills, ok := m.skills[skill.PlayerID]
	if !ok {
		skills = []*domain.PlayerSkill{}
		m.skills[skill.PlayerID] = skills
	}

	// Find if the skill already exists
	var found bool
	for i, existingSkill := range skills {
		if existingSkill.SkillType == skill.SkillType {
			// Update existing skill
			skills[i].Level = skill.Level
			skills[i].UpdatedAt = skill.UpdatedAt
			found = true
			break
		}
	}

	// Add new skill if not found
	if !found {
		skill.ID = int64(len(skills) + 1)
		m.skills[skill.PlayerID] = append(m.skills[skill.PlayerID], skill)
	}

	return nil
}

// Payment methods implementation
func (m *MockPlayerUseCase) CreatePayment(payment *domain.Payment) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.lastID++
	payment.ID = m.lastID

	if payment.CreatedAt.IsZero() {
		payment.CreatedAt = time.Now()
	}
	if payment.UpdatedAt.IsZero() {
		payment.UpdatedAt = time.Now()
	}

	m.payments[payment.ID] = payment
	return nil
}

func (m *MockPlayerUseCase) UpdatePayment(payment *domain.Payment) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if _, exists := m.payments[payment.ID]; !exists {
		return nil // No error if payment doesn't exist for simplicity
	}

	payment.UpdatedAt = time.Now()
	m.payments[payment.ID] = payment
	return nil
}

func (m *MockPlayerUseCase) GetPaymentByID(id int64) (*domain.Payment, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if payment, exists := m.payments[id]; exists {
		return payment, nil
	}
	return nil, nil
}
