-- ============================================================
-- InsurePro IAM Service - V4: Align compliance role name
-- Renames ROLE_COMPLIANCE_OFFICER to ROLE_COMPLIANCE so that
-- Spring Security @PreAuthorize("hasRole('COMPLIANCE')") works.
-- ============================================================
USE insurepro_iam;

UPDATE roles SET name = 'ROLE_COMPLIANCE' WHERE name = 'ROLE_COMPLIANCE_OFFICER';
