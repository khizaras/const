-- Issues/Punch module schema (incremental)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  number INT UNSIGNED NOT NULL,
  type ENUM('issue','punch','observation') NOT NULL DEFAULT 'issue',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open','in_progress','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  trade VARCHAR(64) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  closed_at DATETIME DEFAULT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  assigned_to_user_id BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_issues_project_number (project_id, number),
  KEY idx_issues_project_status_due (project_id, status, due_date),
  KEY idx_issues_assigned (assigned_to_user_id)
) ENGINE=InnoDB;
