-- InsurePro - Database Initialization
-- Run once on MySQL startup to create all service databases
CREATE DATABASE IF NOT EXISTS insurepro_iam       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_customer  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_policy    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_claims    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_payment   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_audit     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_underwriting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insurepro_document  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON insurepro_iam.*            TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_customer.*       TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_policy.*         TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_claims.*         TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_payment.*        TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_notification.*   TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_audit.*          TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_analytics.*      TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_underwriting.*   TO 'insurepro'@'%';
GRANT ALL PRIVILEGES ON insurepro_document.*       TO 'insurepro'@'%';
FLUSH PRIVILEGES;
