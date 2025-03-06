<h1 align="center">Domain Locker</h1>
<p align="center">
	<i>The Central Hub for all your Domain Names</i>
  <br>
  <b>🌐<a href="https://domain-locker.com">domain-locker.com</a></b>
</p>
<p align="center">
  <img width="48" src="https://i.ibb.co/Zp8mm1kp/dl-square.png" />
</p>

---

<details>
  <summary><h4>Contents</h4></summary>
  
  - [About](#about)
	- [Screenshot](#screenshot)
	- [Features](#features)
	- [Live Demo](#demo)
- [Get Started](#get-started)
	- [Self-Hosting](#self-hosting)
- [Developing](#developing)
  - [App Setup](#project-setup)
  - [Architecture](#architecture)
  - [Contributing](#contributing)
- [Attributions](#attributions)
- [License](#license)
</details>

## About

The aim of Domain Locker, is to give you complete visibility of your domain name portfolio, in once central place.

For each domain you add, we analyse it and fetch all associated data. We then continuously monitor your domains, and notify you (according to your preferences) when something important changes or when it's soon to expire. 

You'll get detailed domain analysis, security insights, change history, recent performance, valuation data and much more. Never loose track of your domains, miss an expiration, or forget which registrar and providers each domain uses.

### Screenshot

<p align="center">
<img width="800" src="/.github/screenshots/screenshot-grid.png" />
</p>

### Features

- 📡 Auto-fetched assets: SSL certs, hosts, registrars, IPs, subdomains, DNS, etc
- 🔬 View detailed metrics and analysis for each domain
- 📊 Visual analytics and breakdowns and trends across your portfolio
- 💬 Configurable alerts and webhook notifications
- 🗃️ Easy import/export, as well as API data access
- 📜 Track changes in domain configuration over time
- 📈 Monitor website health, security and performance
- 💹 Keep record of purchase prices and renewal costs
- 🔖 Add categories, and link related resources to domains
- 🎨 Multi-language support, dark/light/custom themes


### Demo

Try the live demo to [demo.domain-locker.com](https://demo.domain-locker.com) <br>
(Username: `demo@domain-locker.com` Password: `domainlocker`)

---

## Get Started

To use Domain Locker, you have two options:

1. The managed instance, at **[domain-locker.com](http://domain-locker.com/)** _(free)_
2. Or **[self-hosting](#deployment)** yourself via Docker _(also free, ofc!)_


### Self-Hosting

```bash
TODO
```

---

## Developing

#### Project Setup

```bash
git clone git@github.com:Lissy93/domain-locker.git	# Get the code
cd domain-locker					# Navigate into directory
npm install						# Install dependencies
cp .env.example .env					# Set environmental variables
npm run dev						# Start the dev server
```

You'll of course need Git and Node installed on your system.<br>
The example .env file includes the public credentials for our Supabase dev instance, which you're free to use for development purposes. However, note that data will be periodically wiped, and the instance is quite locked down. So you may instead wish to self-host your own Supabase instance or Postgres database, and then update your env vars accordingly.

#### Architecture
#### Tech Stack

Domain Locker is made up of an app, database and some API endpoints.
- **The app** is built with Angular, using Analog+Nitro with PrimeNg components, and Tailwind for styling
- **The server** is a series of Deno endpoints with Typescript functions
- **The database** can be either Postgres or Supabase

While the self-hosted instance is intended to be deployed stand-alone, the managed version however depends on a few additional third-party services, which you can see below

<p align="center">
<img width="800" src="/.github/screenshots/architecture.png" />
<br>
<span>You can view docs for the technologies and services used <a href="https://domain-locker.com/about/developing/third-party-docs">here</a></span>
</p>

#### Database

A database is needed to store all your domains and associated info. Domain Locker supports both Supabase and standard Postgres for storing data. The db used will depend on which env vars are set.

- **Supabase**: Follow the Supabase [self-hosting docs](https://supabase.com/docs/guides/self-hosting), then use [dl-sb-iac](https://github.com/lissy93/dl-sb-iac) to import the schema and configure auth, edge functions, emails, etc.
	- Then set: `SUPABASE_URL` and `SUPABASE_ANON_KEY` environmental variables
- **Postgres**: Deploy a Postgres instance, then use our [`setup-postgres.sh`](https://github.com/Lissy93/domain-locker/blob/main/db/setup-postgres.sh) script to init your DB with our[`schema.sql`](https://github.com/Lissy93/domain-locker/blob/main/db/schema.sql)
	- Then set: `DL_PG_HOST`, `DL_PG_PORT`, `DL_PG_USER`, `DL_PG_PASSWORD`, `DL_PG_NAME`


#### Contributing

---

## Attributions

##### Contributors

![contributors](https://readme-contribs.as93.net/contributors/lissy93/domain-locker)

##### Sponsors

![sponsors](https://readme-contribs.as93.net/sponsors/lissy93)

---

## License


> _**[Lissy93/Domain-Locker](https://github.com/Lissy93/domain-locker)** is licensed under [MIT](https://github.com/Lissy93/domain-locker/blob/HEAD/LICENSE) © [Alicia Sykes](https://aliciasykes.com) 2025._<br>
> <sup align="right">For information, see <a href="https://tldrlegal.com/license/mit-license">TLDR Legal > MIT</a></sup>

<details>
<summary>Expand License</summary>

```
The MIT License (MIT)
Copyright (c) Alicia Sykes <alicia@omg.com> 

Permission is hereby granted, free of charge, to any person obtaining a copy 
of this software and associated documentation files (the "Software"), to deal 
in the Software without restriction, including without limitation the rights 
to use, copy, modify, merge, publish, distribute, sub-license, and/or sell 
copies of the Software, and to permit persons to whom the Software is furnished 
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included install 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANT ABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

</details>

<!-- License + Copyright -->
<p  align="center">
  <i>© <a href="https://aliciasykes.com">Alicia Sykes</a> 2025</i><br>
  <i>Licensed under <a href="https://gist.github.com/Lissy93/143d2ee01ccc5c052a17">MIT</a></i><br>
  <a href="https://github.com/lissy93"><img src="https://i.ibb.co/4KtpYxb/octocat-clean-mini.png" /></a><br>
  <sup>Thanks for visiting :)</sup>
</p>

<!-- Dinosaurs are Awesome -->
<!-- 
                        . - ~ ~ ~ - .
      ..     _      .-~               ~-.
     //|     \ `..~                      `.
    || |      }  }              /       \  \
(\   \\ \~^..'                 |         }  \
 \`.-~  o      /       }       |        /    \
 (__          |       /        |       /      `.
  `- - ~ ~ -._|      /_ - ~ ~ ^|      /- _      `.
              |     /          |     /     ~-.     ~- _
              |_____|          |_____|         ~ - . _ _~_-_
-->
