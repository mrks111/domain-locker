---
slug: api-endpoints
title: API Endpoints
description: Running certain logic on the server-side
coverImage: 
---

Sometimes logic needs to run on the server-side, such as when interacting with a database or external API. This is where API endpoints come in. We use H3 and Nitro for this, as it makes it easy to deploy serverless functions in a platform-agnostic way across runtimes.

## Creating Server-Side Endpoints

To create an API route, add a new file to [src/server/routes](https://github.com/Lissy93/domain-locker/tree/main/src/server/routes).

The structure of the file should look like this:

```typescript
import { defineEventHandler } from 'h3';
export default defineEventHandler(() => ({ message: 'Hello World' }));
```

This is made possible with Nitro, and you can view the [relevant docs](https://nitro.build/guide/utils) for more information.

---

### Authorization for API Endpoints

For the endpoints within `./src/server/routes/*` we can easily prevent access to users
who are not authorized to access it (either because they're trying to call directly, or are not authenticated, or don't have the right permissions).

We can implement this easily for any new API endpoint, using the [`auth.ts`](https://github.com/Lissy93/domain-locker/blob/main/src/server/utils/auth.ts) util. This works, because of the frontend [`auth.interceptor.ts`](https://github.com/Lissy93/domain-locker/blob/main/src/app/utils/auth.interceptor.ts), which will add the `Authorization` header to any request made from the frontend, if sent to any `/api/` endpoint, and if auth is configured.

Usage example:

```typescript
import { verifyAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {

  const authResult = await verifyAuth(event);

  if (!authResult.success) {
    return { statusCode: 401, body: { error: authResult.error } };
  }

  // Continue with authorized logic here...
});
```

Note that this is currently only setup to support auth from Supabase instances.
