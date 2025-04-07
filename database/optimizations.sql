-- Ensure this script is run AFTER schema.sql and data population

-- === Stored Procedure Example ===
-- Calculates the average quality of wines with alcohol content >= specified level

CREATE OR REPLACE FUNCTION calculate_average_quality(min_alcohol_level REAL)
RETURNS NUMERIC -- Use NUMERIC for potentially more precise average
LANGUAGE plpgsql
AS $$
DECLARE
    avg_quality NUMERIC;
BEGIN
    SELECT AVG(quality)
    INTO avg_quality
    FROM wines
    WHERE alcohol >= min_alcohol_level;

    -- Return the calculated average, or NULL if no matching wines
    RETURN avg_quality;
END;
$$;

COMMENT ON FUNCTION calculate_average_quality(real) IS 'Calculates the average quality rating for wines with alcohol content at or above the specified minimum level.';

-- Example call (from psql or your app):
-- SELECT calculate_average_quality(12.5);


-- === Trigger Example: Audit Log ===
-- Logs changes (INSERT, UPDATE, DELETE) to the wines table quality

CREATE OR REPLACE FUNCTION log_wine_change()
RETURNS TRIGGER AS $$
DECLARE
    v_action_type VARCHAR(10);
BEGIN
    -- Determine action type
    IF (TG_OP = 'DELETE') THEN
        v_action_type := 'DELETE';
        -- Use OLD record for DELETE operations
        INSERT INTO wine_audit_log (wine_id, action_type, old_quality, new_quality)
        VALUES (OLD.id, v_action_type, OLD.quality, NULL);
        RETURN OLD; -- Return OLD for DELETE triggers
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action_type := 'UPDATE';
        -- Log only if quality actually changed (optional optimization)
        IF OLD.quality IS DISTINCT FROM NEW.quality THEN
            INSERT INTO wine_audit_log (wine_id, action_type, old_quality, new_quality)
            VALUES (NEW.id, v_action_type, OLD.quality, NEW.quality);
        END IF;
        RETURN NEW; -- Return NEW for UPDATE triggers
    ELSIF (TG_OP = 'INSERT') THEN
        v_action_type := 'INSERT';
        -- Use NEW record for INSERT operations
        INSERT INTO wine_audit_log (wine_id, action_type, old_quality, new_quality)
        VALUES (NEW.id, v_action_type, NULL, NEW.quality);
        RETURN NEW; -- Return NEW for INSERT triggers
    END IF;
    RETURN NULL; -- Should not happen, but required for function completeness
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS wines_audit_trigger ON wines;

-- Create the trigger to fire AFTER insert, update, or delete
CREATE TRIGGER wines_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON wines
FOR EACH ROW
EXECUTE FUNCTION log_wine_change();

COMMENT ON TRIGGER wines_audit_trigger ON wines IS 'Logs INSERT, UPDATE, and DELETE operations on the wines table into the wine_audit_log table.';