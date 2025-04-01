package postgres

import (
	"database/sql"
	"time"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type postgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) domain.Repository {
	return &postgresRepository{db: db}
}

// Player methods
func (r *postgresRepository) CreatePlayer(player *domain.Player) error {
	query := `
        INSERT INTO players (telegram_id, username, emblems, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`

	now := time.Now()
	player.CreatedAt = now
	player.UpdatedAt = now

	return r.db.QueryRow(
		query,
		player.TelegramID,
		player.Username,
		player.Emblems,
		player.CreatedAt,
		player.UpdatedAt,
	).Scan(&player.ID)
}

func (r *postgresRepository) GetPlayerByTelegramID(telegramID int64) (*domain.Player, error) {
	player := &domain.Player{}
	query := `
        SELECT id, telegram_id, username, emblems, created_at, updated_at
        FROM players
        WHERE telegram_id = $1`

	err := r.db.QueryRow(query, telegramID).Scan(
		&player.ID,
		&player.TelegramID,
		&player.Username,
		&player.Emblems,
		&player.CreatedAt,
		&player.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return player, err
}

func (r *postgresRepository) UpdatePlayer(player *domain.Player) error {
	query := `
        UPDATE players
        SET username = $1, emblems = $2, updated_at = $3
        WHERE id = $4`

	player.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		player.Username,
		player.Emblems,
		player.UpdatedAt,
		player.ID,
	)
	return err
}

// PlayerSkill methods
func (r *postgresRepository) GetPlayerSkills(playerID int64) ([]*domain.PlayerSkill, error) {
	query := `
        SELECT id, player_id, skill_type, level, created_at, updated_at
        FROM player_skills
        WHERE player_id = $1`

	rows, err := r.db.Query(query, playerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []*domain.PlayerSkill
	for rows.Next() {
		skill := &domain.PlayerSkill{}
		err := rows.Scan(
			&skill.ID,
			&skill.PlayerID,
			&skill.SkillType,
			&skill.Level,
			&skill.CreatedAt,
			&skill.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return skills, nil
}

func (r *postgresRepository) SavePlayerSkill(skill *domain.PlayerSkill) error {
	// Using upsert to insert or update the skill
	query := `
        INSERT INTO player_skills (player_id, skill_type, level, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (player_id, skill_type) 
        DO UPDATE SET level = $3, updated_at = $5
        RETURNING id`

	now := time.Now()
	if skill.CreatedAt.IsZero() {
		skill.CreatedAt = now
	}
	skill.UpdatedAt = now

	return r.db.QueryRow(
		query,
		skill.PlayerID,
		skill.SkillType,
		skill.Level,
		skill.CreatedAt,
		skill.UpdatedAt,
	).Scan(&skill.ID)
}
