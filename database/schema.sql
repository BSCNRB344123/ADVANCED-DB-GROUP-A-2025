-- database/schema.sql

-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS wine_audit_log;
DROP TABLE IF EXISTS wines;

-- Create the main table for wine quality data
CREATE TABLE wines (
    id SERIAL PRIMARY KEY,                      -- Unique identifier for each wine record
    wine_type VARCHAR(5) NOT NULL CHECK (wine_type IN ('red', 'white')), -- Added: Type of wine
    fixed_acidity REAL,
    volatile_acidity REAL,
    citric_acid REAL,
    residual_sugar REAL,
    chlorides REAL,
    free_sulfur_dioxide REAL,
    total_sulfur_dioxide REAL,
    density REAL,
    pH REAL,
    sulphates REAL,
    alcohol REAL,
    quality SMALLINT CHECK (quality >= 0 AND quality <= 10), -- Target variable (0-10 rating)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Primary Key index is created automatically.
CREATE INDEX idx_wines_quality ON wines(quality);
CREATE INDEX idx_wines_alcohol ON wines(alcohol);
CREATE INDEX idx_wines_type ON wines(wine_type); -- Added: Index on wine_type

-- Create an audit log table (for Trigger example)
CREATE TABLE wine_audit_log (
    log_id SERIAL PRIMARY KEY,
    wine_id INT,                              -- Reference to the wine record affected
    action_type VARCHAR(10) NOT NULL,         -- INSERT, UPDATE, DELETE
    old_quality SMALLINT,                     -- Quality before change (for UPDATE/DELETE)
    new_quality SMALLINT,                     -- Quality after change (for INSERT/UPDATE)
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update the updated_at timestamp on any row update
-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_wines_modtime ON wines;

CREATE TRIGGER update_wines_modtime
BEFORE UPDATE ON wines
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();