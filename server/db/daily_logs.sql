-- Daily Logs module schema (incremental)
-- No foreign keys (project/user IDs stored as plain references)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS daily_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  shift ENUM('day','night') NOT NULL DEFAULT 'day',
  weather_conditions VARCHAR(128) DEFAULT NULL,
  work_summary TEXT DEFAULT NULL,
  safety_notes TEXT DEFAULT NULL,
  delays_issues TEXT DEFAULT NULL,
  status ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  client_updated_at DATETIME DEFAULT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  updated_by_user_id BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_daily_logs_project_date_shift (project_id, log_date, shift),
  KEY idx_daily_logs_project_date (project_id, log_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS daily_log_labor (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  daily_log_id BIGINT UNSIGNED NOT NULL,
  trade VARCHAR(64) NOT NULL,
  headcount INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_daily_log_labor_log (daily_log_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS daily_log_equipment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  daily_log_id BIGINT UNSIGNED NOT NULL,
  equipment_name VARCHAR(128) NOT NULL,
  hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_daily_log_equipment_log (daily_log_id)
) ENGINE=InnoDB;
