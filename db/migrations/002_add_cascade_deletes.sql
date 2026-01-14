-- Add cascade delete constraints to allow user deletion
-- This allows deleting users even when they have associated jobs, settings, etc.

-- Drop existing foreign key constraints and recreate with CASCADE
ALTER TABLE jobs 
  DROP CONSTRAINT IF EXISTS jobs_user_id_users_id_fk,
  ADD CONSTRAINT jobs_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE company_settings 
  DROP CONSTRAINT IF EXISTS company_settings_user_id_users_id_fk,
  ADD CONSTRAINT company_settings_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE invoice_services 
  DROP CONSTRAINT IF EXISTS invoice_services_job_id_jobs_id_fk,
  ADD CONSTRAINT invoice_services_job_id_jobs_id_fk 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
