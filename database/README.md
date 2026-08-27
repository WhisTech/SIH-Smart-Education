# Database

This folder contains all SQL scripts used to create and update the SIH Smart Education database.

## Database

We use **Supabase PostgreSQL** as the project database.

## Structure

SQL files are numbered according to the order in which they should be executed.

```text
database/
├── README.md
├── 001_employee_profiles.sql
├── 002_competency_framework.sql
├── 003_assessments.sql
└── ...
```

## SQL File Rules

* Use a three-digit number at the beginning of every SQL file.
* Create a new SQL file for every database change.
* Do not delete previously executed SQL files.
* Do not modify an SQL file after it has been executed on the shared database.
* Add new changes through a new numbered SQL file.
* Test SQL in the Supabase SQL Editor before committing it.
* Never store passwords, API keys, secret keys, or other credentials in this folder.

## Current Database

The current database contains:

```text
employee_profiles
```

The database will be expanded as Feature 1 is developed.

## Development Workflow

1. Create or modify the required SQL.
2. Test the SQL in the Supabase project.
3. Verify that the database works correctly.
4. Save the SQL as the next numbered file.
5. Commit the SQL file to Git.
6. Push the changes to the feature branch.
7. Create a Pull Request.

## Security

Row Level Security (RLS) must remain enabled for tables that contain user data.

Supabase secret keys must never be committed to GitHub.

Frontend environment variables and backend secrets must be stored in local environment files and must not be committed.
