import { createError, defineEventHandler, readBody, sendError } from 'h3';
import pkg from 'pg';
const { Client } = pkg;

export default defineEventHandler(async (event) => {
  try {
    // Read the request body
    const body = await readBody(event);

    // Ensure query is provided in the request
    if (!body?.query) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing query in request body' }));
    }

    // Database connection configuration
    const client = new Client({
      host: process.env['DL_PG_HOST'],
      port: parseInt(process.env['DL_PG_PORT'] || '5432', 10),
      database: process.env['DL_PG_NAME'],
      user: process.env['DL_PG_USER'],
      password: process.env['DL_PG_PASSWORD'],
    });

    // Connect to the database
    await client.connect();

    try {
      // Execute the query and return the result
      const result = await client.query(body.query, body.params || []);
      return { data: result.rows };
    } catch (queryError: Error | any) {
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
      // Ensure the client disconnects after query execution
      await client.end();
    }
  } catch (error: Error | any) {
    console.error('Unexpected error:', error);
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Unexpected server error',
        data: { error: error.message },
      })
    );
  }
});
