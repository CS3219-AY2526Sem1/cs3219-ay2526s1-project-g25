CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    roles TEXT[] DEFAULT ARRAY['user'],
    profile_pic TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);