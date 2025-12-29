/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `attachments`;
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) unsigned NOT NULL,
  `file_id` bigint(20) unsigned NOT NULL,
  `attached_by_user_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_attachments_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `attachments` (`id`, `entity_type`, `entity_id`, `file_id`, `attached_by_user_id`, `created_at`) VALUES
	(1, 'rfi', 8, 1, 2, '2025-12-07 17:34:31'),
	(2, 'rfi', 9, 2, 2, '2025-12-07 18:22:56'),
	(3, 'rfi', 10, 3, 2, '2025-12-07 18:31:40'),
	(4, 'rfi', 11, 4, 2, '2025-12-13 06:55:14'),
	(5, 'rfi', 12, 5, 2, '2025-12-13 07:00:07');

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) unsigned NOT NULL,
  `action` varchar(64) NOT NULL,
  `actor_user_id` bigint(20) unsigned DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `comments`;
CREATE TABLE IF NOT EXISTS `comments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) unsigned NOT NULL,
  `author_user_id` bigint(20) unsigned NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_comments_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `files`;
CREATE TABLE IF NOT EXISTS `files` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned DEFAULT NULL,
  `storage_key` varchar(512) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) DEFAULT NULL,
  `size_bytes` bigint(20) unsigned DEFAULT NULL,
  `sha256` char(64) DEFAULT NULL,
  `uploaded_by_user_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_files_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `files` (`id`, `organization_id`, `project_id`, `storage_key`, `original_name`, `mime_type`, `size_bytes`, `sha256`, `uploaded_by_user_id`, `created_at`) VALUES
	(1, 1, 1, '2a518237-cc0e-4e7a-b8e2-7ae5748824e2.txt', 'test-drawing.txt', 'text/plain', 56, 'd9277ba3b12107d2c2438dc16acad739967cbd03b8bee78511576554778822ba', 2, '2025-12-07 17:34:31'),
	(2, 1, 1, '299187fb-f082-4134-b1c3-71b59e2cb03e.jpg', 'iridhidogra_1733734205_3519140042282946801_238526258.jpg', 'image/jpeg', 134466, '460a00f086f1402829aec851f779299667a27b82ce4a48783a6f66c0b9ecb673', 2, '2025-12-07 18:22:56'),
	(3, 1, 1, 'a081320e-2f54-4657-9424-0c4c042fa236.jpg', 'iridhidogra_1733734205_3519140042282946801_238526258.jpg', 'image/jpeg', 134466, '460a00f086f1402829aec851f779299667a27b82ce4a48783a6f66c0b9ecb673', 2, '2025-12-07 18:31:40'),
	(4, 1, 1, '8812f862-c408-4e66-9b90-aa325f2a394b.png', 'Screenshot 2025-12-07 200622.png', 'image/png', 315901, 'cbdfea0a947e497df52c84b834286938d8eba6cca886f8537d778eb4ad4852e5', 2, '2025-12-13 06:55:14'),
	(5, 1, 1, '97f126d1-98f8-4b38-9459-a845d973e7c9.png', 'Screenshot 2025-12-07 200622.png', 'image/png', 315901, 'cbdfea0a947e497df52c84b834286938d8eba6cca886f8537d778eb4ad4852e5', 2, '2025-12-13 07:00:07');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(64) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) unsigned NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `organizations`;
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `organizations` (`id`, `name`, `created_at`, `updated_at`) VALUES
	(1, 'Demo GC', '2025-12-07 10:17:41', '2025-12-07 10:17:41'),
	(2, 'Test Org', '2025-12-13 08:04:25', '2025-12-13 08:04:25');

DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) DEFAULT NULL,
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_projects_org_code` (`organization_id`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `projects` (`id`, `organization_id`, `name`, `code`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Tower A', 'TWR-A', 'active', NULL, NULL, '2025-12-07 10:17:41', '2025-12-07 10:17:41'),
	(2, 2, 'North River Terminal', 'NRT-001', 'active', NULL, NULL, '2025-12-13 08:04:25', '2025-12-13 08:04:25'),
	(3, 1, 'Tower B', 'TWERB', 'active', NULL, NULL, '2025-12-13 13:24:17', '2025-12-13 13:24:17');

DROP TABLE IF EXISTS `project_role_assignments`;
CREATE TABLE IF NOT EXISTS `project_role_assignments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_proj_role_user` (`project_id`,`user_id`,`role_id`),
  KEY `fk_pra_user` (`user_id`),
  KEY `fk_pra_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `project_users`;
CREATE TABLE IF NOT EXISTS `project_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `role` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_project_user` (`project_id`,`user_id`),
  KEY `idx_project_users_role` (`project_id`,`role`),
  KEY `fk_project_users_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `project_users` (`id`, `project_id`, `user_id`, `role`, `created_at`) VALUES
	(1, 1, 1, 'pm', '2025-12-07 10:17:41'),
	(2, 1, 2, 'admin', '2025-12-07 10:17:41'),
	(3, 1, 3, 'member', '2025-12-07 10:56:22'),
	(4, 2, 4, 'pm', '2025-12-13 08:04:25'),
	(5, 2, 5, 'member', '2025-12-13 08:35:04'),
	(6, 2, 6, 'member', '2025-12-13 08:35:45'),
	(7, 2, 7, 'member', '2025-12-13 08:37:41'),
	(8, 2, 8, 'member', '2025-12-13 08:51:05'),
	(9, 2, 9, 'member', '2025-12-13 08:51:29'),
	(10, 2, 10, 'member', '2025-12-13 08:54:39'),
	(12, 3, 2, 'admin', '2025-12-13 13:24:17');

DROP TABLE IF EXISTS `rfis`;
CREATE TABLE IF NOT EXISTS `rfis` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint(20) unsigned NOT NULL,
  `number` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `question` text NOT NULL,
  `status` enum('open','answered','closed','void') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `discipline` varchar(64) DEFAULT NULL,
  `spec_section` varchar(64) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `needed_by` date DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_by_user_id` bigint(20) unsigned NOT NULL,
  `assigned_to_user_id` bigint(20) unsigned DEFAULT NULL,
  `ball_in_court_user_id` bigint(20) unsigned DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rfis_project_number` (`project_id`,`number`),
  KEY `idx_rfis_project_status_due` (`project_id`,`status`,`due_date`),
  KEY `idx_rfis_assigned` (`assigned_to_user_id`),
  KEY `idx_rfis_bic` (`ball_in_court_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `rfis` (`id`, `project_id`, `number`, `title`, `question`, `status`, `priority`, `discipline`, `spec_section`, `location`, `due_date`, `needed_by`, `closed_at`, `created_by_user_id`, `assigned_to_user_id`, `ball_in_court_user_id`, `is_private`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 'Clarify fa�ade detail', 'Please confirm the mullion finish at level 20.', 'answered', 'high', NULL, NULL, NULL, '2025-12-15', NULL, NULL, 1, NULL, 1, 0, '2025-12-07 10:17:50', '2025-12-13 08:05:53'),
	(2, 1, 2, 'Test RFI - Foundation Wall Detail', 'Please clarify the reinforcement requirements for the foundation wall at grid line A. The structural drawings show #5 bars but the specifications indicate #6 bars.', 'open', 'medium', NULL, '03300', 'Foundation - Grid Line A', NULL, NULL, NULL, 2, NULL, 2, 0, '2025-12-07 16:50:26', '2025-12-07 16:50:26'),
	(3, 1, 3, 'New Test RFI', 'New Test rfi is vaild ?', 'open', 'high', 'Structural', NULL, NULL, '2025-12-31', NULL, NULL, 2, NULL, 2, 0, '2025-12-07 17:05:17', '2025-12-07 17:05:17'),
	(4, 1, 4, 'Electrical Panel Location Clarification', 'Please confirm the location of electrical panel EP-3 on Level 2. The architectural drawings show it in Room 201 but the electrical drawings indicate Room 203.', 'open', 'high', 'MEP', '26 05 00', 'Level 2, Electrical Room', NULL, NULL, NULL, 2, 1, 1, 0, '2025-12-07 17:22:49', '2025-12-07 17:22:49'),
	(5, 1, 5, 'File Upload Test RFI', 'This is a test RFI to verify that file uploads and attachments are working correctly.', 'open', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, 2, 0, '2025-12-07 17:24:46', '2025-12-07 17:24:46'),
	(6, 1, 6, 'File Upload Test v2', 'Testing file upload with fixed code', 'open', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, 2, 0, '2025-12-07 17:26:36', '2025-12-07 17:26:36'),
	(7, 1, 7, 'Test File Upload - Working Version', 'Testing complete file upload workflow with attachment linking', 'open', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, 2, 0, '2025-12-07 17:31:54', '2025-12-07 17:31:54'),
	(8, 1, 8, 'Final File Upload Test', 'Testing file upload with organizationId fix', 'answered', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, 2, 0, '2025-12-07 17:34:31', '2025-12-13 06:53:26'),
	(9, 1, 9, 'TEsting RFI', 'We will extract up to 500 images from the source media. A minimum of 25 images is required. When face detection is enabled, we also require a minimum of 20 faces of the same human that are at least 300 pixels wide or tall. Jobs that fail will be refunded or resubmitted automatically. If that does not happen quickly enough, contact us through our form or on Discord.\n', 'answered', 'high', 'Structural', '3655', 'Area', '2025-12-09', NULL, NULL, 2, 3, 3, 0, '2025-12-07 18:22:56', '2025-12-07 18:51:27'),
	(10, 1, 10, 'Jobs that fail will be refunded or resubmitted automatically.', 'We will extract up to 500 images from the source media. A minimum of 25 images is required. When face detection is enabled, we also require a minimum of 20 faces of the same human that are at least 300 pixels wide or tall. Jobs that fail will be refunded or resubmitted automatically. If that does not happen quickly enough, contact us through our form or on Discord.\n', 'open', 'medium', 'Structural', '3655', 'Area', '2025-12-11', NULL, NULL, 2, 2, 2, 0, '2025-12-07 18:31:39', '2025-12-07 18:31:39'),
	(11, 1, 11, 'Aditya Birla Sun Life Mutual Fund', '	\nDear Valued Unitholder,\n\nThank you for choosing Aditya Birla Sun Life Mutual Fund as your investment partner. We truly appreciate your trust in us.\nIn compliance with provisions of SEBI circular No. SEBI/HO/IMD/DF2/CIR/P/2018/92 dated June 05, 2018, kindly click on the below links to access the portfolio of your scheme for Month of November 30, 2025.\nAditya Birla Sun Life ELSS Tax Saver Fund\n\n\nFor performance of the scheme please refer:\nhttps://mutualfund.adityabirlacapital.com/forms-and-downloads/disclosures\n\nUnitholders are requested to update their latest e-mail id and mobile number to help us serve better.\n\nSincerely,\nFor Aditya Birla Sun Life AMC Limited\n(Investment Manager for Aditya Birla Sun Life Mutual Fund)', 'open', 'high', 'Structural', '65666', 'test suite 234', '2025-12-14', NULL, NULL, 2, 2, 2, 0, '2025-12-13 06:55:14', '2025-12-13 06:55:14'),
	(12, 1, 12, 'Aditya Birla Sun Life Mutual Fund', '	\nDear Valued Unitholder,\n\nThank you for choosing Aditya Birla Sun Life Mutual Fund as your investment partner. We truly appreciate your trust in us.\nIn compliance with provisions of SEBI circular No. SEBI/HO/IMD/DF2/CIR/P/2018/92 dated June 05, 2018, kindly click on the below links to access the portfolio of your scheme for Month of November 30, 2025.\nAditya Birla Sun Life ELSS Tax Saver Fund\n\n\nFor performance of the scheme please refer:\nhttps://mutualfund.adityabirlacapital.com/forms-and-downloads/disclosures\n\nUnitholders are requested to update their latest e-mail id and mobile number to help us serve better.\n\nSincerely,\nFor Aditya Birla Sun Life AMC Limited\n(Investment Manager for Aditya Birla Sun Life Mutual Fund)', 'open', 'urgent', 'Structural', '5544', 'ytr 455', '2025-12-23', NULL, NULL, 2, 2, 2, 0, '2025-12-13 07:00:07', '2025-12-13 07:00:07'),
	(13, 2, 1, 'Drawing clarification', 'Please clarify detail view location', 'open', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, 4, NULL, NULL, 0, '2025-12-13 08:04:25', '2025-12-13 08:04:25');

DROP TABLE IF EXISTS `rfi_audit_logs`;
CREATE TABLE IF NOT EXISTS `rfi_audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rfi_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` enum('create','update','status_change','response','assign') NOT NULL,
  `field` varchar(64) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rfi_audit_logs_rfi` (`rfi_id`),
  KEY `idx_rfi_audit_logs_project` (`project_id`),
  KEY `fk_rfi_audit_logs_user` (`user_id`),
  CONSTRAINT `fk_rfi_audit_logs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rfi_audit_logs_rfi` FOREIGN KEY (`rfi_id`) REFERENCES `rfis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rfi_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `rfi_audit_logs` (`id`, `rfi_id`, `project_id`, `user_id`, `action`, `field`, `old_value`, `new_value`, `created_at`) VALUES
	(1, 12, 1, 2, 'response', 'response_text', NULL, 'GReat', '2025-12-13 08:08:08');

DROP TABLE IF EXISTS `rfi_responses`;
CREATE TABLE IF NOT EXISTS `rfi_responses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rfi_id` bigint(20) unsigned NOT NULL,
  `responded_by_user_id` bigint(20) unsigned NOT NULL,
  `response_text` text NOT NULL,
  `is_official` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rfi_responses_rfi` (`rfi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `rfi_responses` (`id`, `rfi_id`, `responded_by_user_id`, `response_text`, `is_official`, `created_at`) VALUES
	(1, 1, 2, 'done, working on it', 0, '2025-12-07 16:36:51'),
	(2, 2, 2, 'Per structural engineer review, the correct reinforcement is #6 bars at 12" O.C. both ways. The drawings will be revised in the next submittal. Please proceed with #6 bars as specified.', 0, '2025-12-07 16:50:51'),
	(3, 9, 2, 'test', 0, '2025-12-07 18:26:02'),
	(4, 9, 2, 'whats happening', 0, '2025-12-07 18:30:13'),
	(5, 9, 2, 'Are you getting my emails ?', 0, '2025-12-07 18:31:02'),
	(6, 9, 2, 'hi', 0, '2025-12-07 18:48:29'),
	(7, 9, 2, 'great job', 0, '2025-12-13 06:53:01'),
	(8, 8, 2, 'great job', 0, '2025-12-13 06:53:19'),
	(9, 1, 4, 'Answer: Use detail 4 on sheet A-201', 0, '2025-12-13 08:04:36'),
	(10, 1, 4, 'Answer: Use detail 4 on sheet A-201', 0, '2025-12-13 08:05:53'),
	(11, 12, 2, 'GReat', 0, '2025-12-13 08:08:08');

DROP TABLE IF EXISTS `rfi_watchers`;
CREATE TABLE IF NOT EXISTS `rfi_watchers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rfi_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rfi_watcher` (`rfi_id`,`user_id`),
  KEY `fk_rfi_watchers_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `rfi_watchers` (`id`, `rfi_id`, `user_id`) VALUES
	(1, 1, 1),
	(2, 1, 2),
	(3, 2, 2),
	(4, 3, 2),
	(5, 4, 2),
	(6, 5, 2),
	(7, 6, 2),
	(8, 7, 2),
	(9, 8, 2),
	(10, 9, 2),
	(11, 10, 2),
	(12, 11, 2),
	(13, 12, 2);

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_roles_org_name` (`organization_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email_org` (`organization_id`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `users` (`id`, `organization_id`, `email`, `password_hash`, `first_name`, `last_name`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 1, 'pm@example.com', 'test123', 'Paula', 'Manager', 1, '2025-12-07 10:17:41', '2025-12-07 10:17:41'),
	(2, 1, 'khizaras@gmail.com', '$2a$10$uN9rEi2v6Pzz2dybqun6LO96G6urvydrX/nCN9WS8Qnh5PQRy3xLi', 'Khizar', 'Ahmed', 1, '2025-12-07 10:17:41', '2025-12-07 18:21:44'),
	(3, 1, 'venkatesh.khanna@yahoo.com ', '$2a$10$uN9rEi2v6Pzz2dybqun6LO96G6urvydrX/nCN9WS8Qnh5PQRy3xLi', 'Venkatesh', 'Khanna', 1, '2025-12-07 10:56:22', '2025-12-07 18:21:53'),
	(4, 2, 'responder@example.com', '$2a$10$Y4iehG5cP3gm6zfQXIJvv.lgfPV2qs9dB3D2Cv2/zosRwNUEj.F8a', 'Responder', 'User', 1, '2025-12-13 08:04:25', '2025-12-13 08:34:46'),
	(5, 2, 'issues.tester+1765614904807@example.com', '$2a$10$Nlybme0nHFIW1JVpRdXVf.n4HT1KAItu549M7FI1txvSirAy1zQXW', 'Issues', 'Tester', 1, '2025-12-13 08:35:04', '2025-12-13 08:35:04'),
	(6, 2, 'issues.tester+1765614944927@example.com', '$2a$10$7VbSVf9726YDYRVbiKtoMeIBShsstvehGS7r1sYwNqnrGiWeOgkO2', 'Issues', 'Tester', 1, '2025-12-13 08:35:45', '2025-12-13 08:35:45'),
	(7, 2, 'issues.tester+1765615061112@example.com', '$2a$10$ccDS3ylbAbf5QYSh.ERaAey7SqGJg.Hl4IoMOK7jh3BoZ52h6eJye', 'Issues', 'Tester', 1, '2025-12-13 08:37:41', '2025-12-13 08:37:41'),
	(8, 2, 'dailylogs.tester+1765615865044@example.com', '$2a$10$FOOiSU9BVludtBAhBhQw8eTKTNH81Pk.xOm2Dbwdf7yduos32qs1W', 'Daily', 'Logger', 1, '2025-12-13 08:51:05', '2025-12-13 08:51:05'),
	(9, 2, 'dailylogs.tester+1765615889421@example.com', '$2a$10$uobwrYYcaSp6XUWN.9RnZubxoFWlRaEWpd0wG3P04Uh60K8hHBPcy', 'Daily', 'Logger', 1, '2025-12-13 08:51:29', '2025-12-13 08:51:29'),
	(10, 2, 'dailylogs.tester+1765616079259@example.com', '$2a$10$iKcZf/pZPcasfq9nDn.XAuqt.vgFF34R/LJ.Tg0lSeqpzn4UIhiom', 'Daily', 'Logger', 1, '2025-12-13 08:54:39', '2025-12-13 08:54:39');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
