-- Migration script to remove gold column from players table
ALTER TABLE players DROP COLUMN IF EXISTS gold; 