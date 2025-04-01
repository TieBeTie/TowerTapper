package usecase

import (
	"sync"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type MockPlayerUseCase struct {
	players map[int64]*domain.Player
	skills  map[int64][]*domain.PlayerSkill
	mutex   sync.RWMutex
}

func NewMockPlayerUseCase() *PlayerUseCase {
	mock := &MockPlayerUseCase{
		players: make(map[int64]*domain.Player),
		skills:  make(map[int64][]*domain.PlayerSkill),
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
