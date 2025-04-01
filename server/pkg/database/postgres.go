package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

func NewPostgresDB(cfg Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

// Создание таблиц
func CreateTables(db *sql.DB) error {
	// Создаем таблицу players
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS players (
			id BIGSERIAL PRIMARY KEY,
			telegram_id BIGINT UNIQUE NOT NULL,
			username VARCHAR(255) NOT NULL,
			emblems BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating players table: %v", err)
	}

	// Создаем таблицу player_skills для постоянных навыков
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS player_skills (
			id BIGSERIAL PRIMARY KEY,
			player_id BIGINT NOT NULL REFERENCES players(id),
			skill_type VARCHAR(50) NOT NULL,
			level INT NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			UNIQUE(player_id, skill_type)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating player_skills table: %v", err)
	}

	return nil
}
