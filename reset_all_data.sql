-- InsurePro — Full Data Reset
-- Clears all user/business data. Keeps schemas, flyway history, and seed data (roles, policy_types, risk_rules).
SET FOREIGN_KEY_CHECKS = 0;

-- IAM
USE insurepro_iam;
TRUNCATE TABLE login_attempts;
TRUNCATE TABLE password_history;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE users;
-- Keep: roles (ADMIN, AGENT, etc. seed data)

-- Customers
USE insurepro_customer;
TRUNCATE TABLE kyc_records;
TRUNCATE TABLE agent_customer_mappings;
TRUNCATE TABLE customers;

-- Policies
USE insurepro_policy;
TRUNCATE TABLE policy_endorsements;
TRUNCATE TABLE policies;
-- Keep: policy_types (seed data)

-- Claims
USE insurepro_claims;
TRUNCATE TABLE claim_disputes;
TRUNCATE TABLE claim_notes;
TRUNCATE TABLE settlements;
TRUNCATE TABLE claims;

-- Payments
USE insurepro_payment;
TRUNCATE TABLE refunds;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;

-- Notifications
USE insurepro_notification;
TRUNCATE TABLE notification_preferences;
TRUNCATE TABLE notifications;

-- Audit
USE insurepro_audit;
TRUNCATE TABLE compliance_reports;
TRUNCATE TABLE audit_logs;

-- Analytics
USE insurepro_analytics;
TRUNCATE TABLE kpi_reports;

-- Documents
USE insurepro_document;
TRUNCATE TABLE document_versions;
TRUNCATE TABLE documents;

-- Underwriting
USE insurepro_underwriting;
TRUNCATE TABLE underwriting_requests;
-- Keep: risk_rules (seed data)

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Reset complete. All users and business data cleared.' AS status;
