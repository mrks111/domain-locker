---
title: Self-Hosting Domain Locker
slug: self-hosting  
meta:
  - name: description
    content: About Page Description
  - property: og:title
    content: About
---

I have documented and open sourced Domain Locker for free. You can find the source on GitHub, at [lissy93/domain-locker](https://github.com/lissy93/domain-locker).

### ⚠️ Important Disclaimer
<blockquote class="warning">
The self-hosted edition comes with no warranty. There are no guarantees for functionality and maintaining and securing the infrastructure will be your responsibility. The developer cannot be held liable for any damages or losses caused by the use of the self-hosted edition.

You will need to take care of securing, managing and updating your instance, as well as maintaining availability, backup schedule and provisioning resources.
The self-hosted edition is not intended to be publicly exposed. If you're running it outside of your LAN, then ensure you've secured it behind a firewall, and implemented correct access controls.

If you deploy the code as-is (aka without substantial changes), you must not charge users for access to your instance (as a competing service), without prior consent from Domain Locker's author.
</blockquote>

---

## Prerequisites

In order to self-host Domain Locker, you will need a server.
This can be anything from a low-powered SBC like a Raspberry Pi  to a dedicated VPS.


Domain Locker is intended to be run as a Docker stack. You will need to have Docker and Docker Compose installed on your server.
You may also need a domain name and a valid SSL certificate for that domain.

<img src="https://i.ibb.co/Kj3Z11D9/self-hosted-setup-bg.png" width="400" text-align="center" alt="Self-Hosted Setup">

<style>
  .warning {
    background-color: var(--yellow-200);
    color: var(--yellow-800);
    border: 1px solid var(--yellow-600);
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin: 0.25rem 0 1rem 0;
    font-size: 0.8rem;
    p {
      margin: 0.2rem 0 0 0;
    }
  }
</style>


---

## Raising Issues

