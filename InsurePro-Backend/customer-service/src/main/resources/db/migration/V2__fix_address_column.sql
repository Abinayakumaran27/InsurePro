-- V2: Change address column from JSON to TEXT so plain address strings can be stored.
ALTER TABLE customers MODIFY COLUMN address TEXT;
