-- V5: Remove the hardcoded default 'admin' user seeded by V1.
--     SuperAdmin is created at startup by SuperAdminInitializer instead.

-- Remove role assignments for the old admin user first
DELETE ur FROM user_roles ur
    INNER JOIN users u ON ur.user_id = u.user_id
WHERE u.username = 'admin' AND u.email = 'admin@insurepro.com';

-- Remove refresh tokens
DELETE rt FROM refresh_tokens rt
    INNER JOIN users u ON rt.user_id = u.user_id
WHERE u.username = 'admin' AND u.email = 'admin@insurepro.com';

-- Remove password history
DELETE ph FROM password_history ph
    INNER JOIN users u ON ph.user_id = u.user_id
WHERE u.username = 'admin' AND u.email = 'admin@insurepro.com';

-- Remove login attempts linked to this user
DELETE la FROM login_attempts la
    INNER JOIN users u ON la.user_id = u.user_id
WHERE u.username = 'admin' AND u.email = 'admin@insurepro.com';

-- Finally remove the user
DELETE FROM users WHERE username = 'admin' AND email = 'admin@insurepro.com';
