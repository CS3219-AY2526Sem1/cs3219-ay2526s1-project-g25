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
    test_cases JSONB NOT NULL
);

INSERT INTO questions (title, description, difficulty, topic, test_cases) VALUES (
    'Reverse a String',
    'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.

Example 1:
Input: s =
["h","e","l","l","o"]
Output:
["o","l","l","e","h"]

Example 2:
Input: s =
["H","a","n","n","a","
h"]
Output:
["h","a","n","n","a","
H"]

Constraints:
1 <= s.length <= 105
s[i] is a printable ascii character.',
    'easy',
    'Strings',
    '{ "cases": [ { "s": "[\"h\",\"e\",\"l\",\"l\",\"o\"]" } ] }'
);
