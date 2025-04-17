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
        INSERT INTO players (telegram_id, username, emblems, max_wave_completed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`

	now := time.Now()
	player.CreatedAt = now
	player.UpdatedAt = now

	return r.db.QueryRow(
		query,
		player.TelegramID,
		player.Username,
		player.Emblems,
		player.MaxWaveCompleted,
		player.CreatedAt,
		player.UpdatedAt,
	).Scan(&player.ID)
}

func (r *postgresRepository) GetPlayerByTelegramID(telegramID int64) (*domain.Player, error) {
	player := &domain.Player{}
	query := `
        SELECT id, telegram_id, username, emblems, max_wave_completed, created_at, updated_at
        FROM players
        WHERE telegram_id = $1`

	err := r.db.QueryRow(query, telegramID).Scan(
		&player.ID,
		&player.TelegramID,
		&player.Username,
		&player.Emblems,
		&player.MaxWaveCompleted,
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
        SET username = $1, emblems = $2, max_wave_completed = $3, updated_at = $4
        WHERE id = $5`

	player.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		player.Username,
		player.Emblems,
		player.MaxWaveCompleted,
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

// Payment methods
func (r *postgresRepository) CreatePayment(payment *domain.Payment) error {
	query := `
		INSERT INTO payments (player_id, amount, emblems_qty, status, invoice_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	now := time.Now()
	if payment.CreatedAt.IsZero() {
		payment.CreatedAt = now
	}
	if payment.UpdatedAt.IsZero() {
		payment.UpdatedAt = now
	}

	return r.db.QueryRow(
		query,
		payment.PlayerID,
		payment.Amount,
		payment.EmblemsQty,
		payment.Status,
		payment.InvoiceURL,
		payment.CreatedAt,
		payment.UpdatedAt,
	).Scan(&payment.ID)
}

func (r *postgresRepository) UpdatePayment(payment *domain.Payment) error {
	query := `
		UPDATE payments
		SET player_id = $1, amount = $2, emblems_qty = $3, 
		    status = $4, invoice_url = $5, updated_at = $6,
		    completed_at = $7
		WHERE id = $8`

	payment.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		payment.PlayerID,
		payment.Amount,
		payment.EmblemsQty,
		payment.Status,
		payment.InvoiceURL,
		payment.UpdatedAt,
		payment.CompletedAt,
		payment.ID,
	)
	return err
}

func (r *postgresRepository) GetPaymentByID(id int64) (*domain.Payment, error) {
	payment := &domain.Payment{}
	query := `
		SELECT id, player_id, amount, emblems_qty, status, 
		       invoice_url, created_at, updated_at, completed_at
		FROM payments
		WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&payment.ID,
		&payment.PlayerID,
		&payment.Amount,
		&payment.EmblemsQty,
		&payment.Status,
		&payment.InvoiceURL,
		&payment.CreatedAt,
		&payment.UpdatedAt,
		&payment.CompletedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return payment, err
}

func (r *postgresRepository) GetTopPlayersByMaxWave(limit int) ([]*domain.Player, error) {
	rows, err := r.db.Query(`
		SELECT id, telegram_id, username, emblems, max_wave_completed, created_at, updated_at
		FROM players
		ORDER BY max_wave_completed DESC, id ASC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []*domain.Player
	for rows.Next() {
		p := &domain.Player{}
		err := rows.Scan(&p.ID, &p.TelegramID, &p.Username, &p.Emblems, &p.MaxWaveCompleted, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, nil
}

func (r *postgresRepository) GetPlayerRankByMaxWave(telegramID int64) (int, error) {
	var maxWave int
	err := r.db.QueryRow(`SELECT max_wave_completed FROM players WHERE telegram_id = $1`, telegramID).Scan(&maxWave)
	if err != nil {
		return 0, err
	}
	var rank int
	err = r.db.QueryRow(`
		SELECT COUNT(*) + 1 FROM players WHERE max_wave_completed > $1
	`, maxWave).Scan(&rank)
	if err != nil {
		return 0, err
	}
	return rank, nil
}
