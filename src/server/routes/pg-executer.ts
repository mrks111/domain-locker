import { createError, defineEventHandler, readBody, sendError } from 'h3';
import pkg from 'pg';
const { Client } = pkg;

export default defineEventHandler(async (event) => {
  try {
    // 1) read request body
    const body = await readBody(event);
    if (!body?.query) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Missing query in request body' })
      );
    }

    const { query, params, credentials } = body;
    // credentials may be undefined, if client didn't pass them.

    // 2) If credentials are provided, use them. Otherwise, environment vars
    const host = credentials?.host || process.env['DL_PG_HOST'];
    const port = credentials?.port || process.env['DL_PG_PORT'] || '5432';
    const user = credentials?.user || process.env['DL_PG_USER'];
    const password = credentials?.password || process.env['DL_PG_PASSWORD'];
    const database = credentials?.database || process.env['DL_PG_NAME'];

    // 3) Validate we have enough info
    if (!host || !user || !password || !database) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          statusMessage: 'Missing Postgres credentials',
        })
      );
    }

    // 4) connect
    const client = new Client({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
    });

    await client.connect().catch((connErr) => {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to connect to Postgres',
        data: { error: connErr.message },
      });
    });

    try {
      // 5) Run the query
      const result = await client.query(query, params || []);
      return { data: result.rows };
    } catch (queryError: any) {
      console.error('Query execution error:', queryError);
      return sendError(
        event,
        createError({
          statusCode: 500,
          statusMessage: 'Error executing query',
          data: { error: queryError.message },
        })
      );
    } finally {
      await client.end();
    }
  } catch (error: any) {
    console.error('Postgres executer faced an unexpected error:', error);
    return sendError(
      event,
      createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || 'Unexpected server error',
        data: { error: error.data?.error || error.message },
      })
    );
  }
});
