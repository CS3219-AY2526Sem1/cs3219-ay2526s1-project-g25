# Question Service

A microservice that provides an API endpoint to perform create, retrieve, update and delete operations on a question database!

## Features
Coming soon!

## Setup
This set of instructions details how to set it up on your local machine.

First, of course, `cd` to this repository and install the packages.
```bash
$> cd question-service
$> npm install
```

Next, set up postgresql.
```bash
$> sudo apt install postgresql
```
Next, sign in as Postgres and create a user and then the question service database:
```sql
CREATE DATABASE question_service;
CREATE USER <username> WITH PASSWORD '<password>';
GRANT ALL PRIVILEGES ON DATABASE question_service TO <username>;
\c question_service
GRANT ALL ON SCHEMA public TO <username>;
```
Finally, load the initialisation script.
```sql
\i db/init.sql
```

More coming soon!
