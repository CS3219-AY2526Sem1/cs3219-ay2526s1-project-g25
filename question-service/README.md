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

Since we are hosting the PostgreSQL database on Supabase, we need to manage the environment variables for connecting to the Supabase instance:

```bash
$> cp .env.example .env
$> vim .env
```

Fill in the respective fields.

<details>
<summary>Set up on a local PostgreSQL Server</summary>

Set up postgresql with:

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
</details>

> [!NOTE]
> Currently, Supabase Row-Level Security is set to restrict operations other than retrieval for all users. This will be updated soon, after more API functionality is developed.

More coming soon!

