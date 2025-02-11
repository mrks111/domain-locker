---
slug: developing
title: Development Setup
description: My First Post Description
coverImage: https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=464&q=80
---

## Setup

### Get the Code

```
git clone git@github.com:Lissy93/domain-locker.git
cd domain-locker
npm install
```

### Start Development Server

```
npm run dev
```

### Run Tests

```
npm run test
```

### Build for Production

```
npm run build
```

Or to build for a particular platform, use the `build:vercel`, `build:netlify` commands.

---

## Database

### Setup

You'll need either a Posthres database, or a Supabase instance.

With Postgres, follow the setup instructions in [Postgres Setup](/about/developing/postgres-setup),
then init the schema and start the DB with `./db/setup-postgres.sh`
to import the [`schema.sql`](https://github.com/Lissy93/domain-locker/blob/main/db/schema.sql).

### Use

Finally, set the environmental variables, so the app can connect to the database.
These variables can be set in a `.env` file, or in your systems environment, or in your hosting provider's settings.


Postgres:

```
DL_PG_HOST='localhost'
DL_PG_PORT='5432'
DL_PG_USER='postgres'
DL_PG_PASSWORD='supersecret'
DL_PG_NAME='domain_locker'
```

Supabase:

```
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xx
```

<details>
<summary>Schema</summary>

The schema can be downloaded from [here](https://github.com/Lissy93/domain-locker/blob/main/db/schema.sql).

Below is a high-level class-diagram.

![Schema](https://gist.github.com/user-attachments/assets/4ddf35df-dad6-4820-b667-6417ef406277)

</details>


---

## Architecture

The self-hosted app is very simple, and consists of 3 containers:
- The app itself
- A Postgres database (to store your data)
- A cron service (optional, to keep domains up-to-date and trigger notifications)

This differs slightly from the managed instance, which has the same core web app, but is reliant upon some non-free services for extra features and security. Such as notification channels, auth/SSO, billing, attack protection, monitoring, availability, backups, hosting, etc. Below is a high-level architecture diagram to show what I mean.

![architecture](https://gist.github.com/user-attachments/assets/00b8b790-ab9d-49f8-ae88-a5dca4120e73)
