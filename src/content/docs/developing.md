---
slug: developing
title: Development Setup
description: My First Post Description
coverImage: https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=464&q=80
---


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

### Set Environmental Variables

Configure your database connection by setting environment variables, using either a `.env` file or your terminal or hosting provider's settings.

Don't forget to seed your database with the provided SQL file.

```
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xx
```

or

```
DL_PG_HOST='localhost'
DL_PG_PORT='5432'
DL_PG_USER='postgres'
DL_PG_PASSWORD='supersecret'
DL_PG_NAME='domain_locker'
```
