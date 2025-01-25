---
slug: postgres-setup
title: Postgres Setup
description: Setting up Postgres for local development
coverImage: 
---



### Installing Postgres

First, install Postgres for your OS if you haven't already done so.

On Debian/Ubuntu/WSL you can run `apt install postgresql`, for other distros or operating systems, you can download it from [here](https://www.postgresql.org/download/).

You should now have access to the `psql` CLI tool, and you can verify that the postgresql service is running with `systemctl status postgresql`.


### Enable Password Authentication

Edit the `pg_hba.conf` file to use `md5` authentication

```bash
sudo nano /etc/postgresql/<version>/main/pg_hba.conf
```
	
And make the following edit:

```diff
- local   all             postgres                                peer
+ local   all             postgres                                md5
```

Also, don't forget to ensure `md5` is set for any `host` entries:

```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Then restart Postgres

```bash
sudo systemctl restart postgresql
```

And finally, set a (secure) password for the postgres user

```
sudo -u postgres psql -c "\password postgres"
```
