DROP TABLE IF EXISTS Questions;
DROP TYPE IF EXISTS difficulty_level;

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE Questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    topic TEXT NOT NULL,
    test_cases JSONB NOT NULL,
    image_url TEXT
);

-- No mock data - questions will be added through admin interface
