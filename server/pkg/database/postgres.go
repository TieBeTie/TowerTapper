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
			coins BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating players table: %v", err)
	}

	// Создаем таблицу castles
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS castles (
			id BIGSERIAL PRIMARY KEY,
			player_id BIGINT NOT NULL REFERENCES players(id),
			level INT NOT NULL DEFAULT 1,
			health INT NOT NULL DEFAULT 100,
			arrow_speed FLOAT NOT NULL DEFAULT 1.0,
			arrow_damage INT NOT NULL DEFAULT 1
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating castles table: %v", err)
	}

	return nil
}
