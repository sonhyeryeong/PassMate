ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
CREATE TABLE local_credentials (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    login_id VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL
);
