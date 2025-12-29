-- Add workflow definition column to projects table for customizable RFI workflows
ALTER TABLE projects ADD COLUMN workflow_definition JSON DEFAULT NULL;
