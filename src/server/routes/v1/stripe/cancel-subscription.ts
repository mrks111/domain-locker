import { defineEventHandler, readBody } from 'h3';

/** Simple helper to get an env var, or fallback, or throw an error if none is found */
const getEnvVar = (key: string, fallback: string | null = null): any => {
  const buildtimeValue = import.meta.env[key];
  const runtimeValue = process && process.env[key];

  const value = (buildtimeValue || runtimeValue) ?? fallback;
  
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
};


// const STRIPE_SECRET_KEY = getEnvVar('STRIPE_SECRET_KEY');
const STRIPE_SECRET_KEY = import.meta.env['STRIPE_SECRET_KEY'] || (process && process.env['STRIPE_SECRET_KEY']) || '';
const stripeApiUrl = 'https://api.stripe.com/v1/subscriptions';


export default defineEventHandler(async (event) => {
  if (event.req.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  if (!STRIPE_SECRET_KEY) {
    return { error: 'Stripe secret key is not set' };
  }

  try {
    const body = await readBody(event);
    if (!body) {
      return { error: 'No request body provided' };
    }

    const { subscriptionId } = body;
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return { error: 'Invalid subscription ID' };
    }

    // 🔥 Use DELETE to cancel subscription immediately
    const response = await fetch(`${stripeApiUrl}/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'invoice_now': 'true', // Immediately generate final invoice
        'prorate': 'true'      // Adjust invoice based on usage
      }).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Stripe API request failed');
    }

    const canceled = await response.json();

    return {
      success: true,
      subscriptionStatus: canceled.status,
      subscriptionId: canceled.id
    };

  } catch (err: any) {
    console.error('Cancel Subscription Error:', err);
    let errorMessage = err.message;
    let statusCode = 400;

    if (err.type === 'StripeCardError' || err.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid request to Stripe';
      statusCode = 400;
    } else if (err.type === 'StripeAuthenticationError') {
      errorMessage = 'Authentication failed';
      statusCode = 401;
    }

    return { error: errorMessage, status: statusCode };
  }
});
