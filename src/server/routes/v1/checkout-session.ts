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

/** Flatten an object into x-www-form-urlencoded style keys */
function flattenObject(obj: any): Record<string, string> {
  const result: Record<string, string> = {};

  function flatten(obj: any, prefix: string = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}[${key}]` : key;
      if (Array.isArray(value)) {
        value.forEach((item, index) => flatten(item, `${newKey}[${index}]`));
      } else if (value && typeof value === 'object') {
        flatten(value, newKey);
      } else {
        result[newKey] = String(value);
      }
    });
  }
  flatten(obj);
  return result;
}

/** Mapping productId -> env var name to read the actual Stripe price ID */
const productIdToEnvVar: Record<string, string> = {
  'dl_hobby_monthly': 'STRIPE_PRICE_HM',
  'dl_hobby_annual':  'STRIPE_PRICE_HA',
  'dl_pro_monthly':   'STRIPE_PRICE_PM',
  'dl_pro_annual':    'STRIPE_PRICE_PA',
};

/**
 * POST /api/v1/checkout-session
 * Body:
 *  userId: string
 *  productId: string
 *  successUrl?: string
 *  cancelUrl?: string
 *
 * Returns JSON: { url: string } or error
 */
export default defineEventHandler(async (event) => {
  try {
    // (attempt to) Read all environment vars
    const STRIPE_SECRET_KEY = getEnvVar('STRIPE_SECRET_KEY');
    const STRIPE_ENDPOINT = getEnvVar('STRIPE_ENDPOINT', 'https://api.stripe.com/v1/checkout/sessions');
    const APP_BASE_URL = getEnvVar('DL_BASE_URL', 'https://domain-locker.com');

    // Parse the POST body for userId, productId, successUrl, cancelUrl
    const inputBody = await readBody(event);
    const { userId, productId, successUrl, cancelUrl } = inputBody || {};    

    if (!userId || !productId) { // Throw error on missing essential fields
      throw new Error('Missing required fields: userId, productId');
    }

    // Map productId -> env var -> actual stripe price ID
    const envVarName = productIdToEnvVar[productId];
    if (!envVarName) {
      throw new Error(`Invalid productId: ${productId}`);
    }
    const price = getEnvVar(envVarName);

    // Build the request headers for Stripe
    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    };

    // Get params for payload body to Stripe
    const success_url = (successUrl || `${APP_BASE_URL}/settings/upgrade`) + '?success=1&session_id={CHECKOUT_SESSION_ID}';
    const cancel_url = (cancelUrl || `${APP_BASE_URL}/settings/upgrade`) + '?cancel=1';
    const line_items = [{ price, quantity: 1 }];
    const mode = 'subscription';
    const subscription_data = { metadata: { user_id: userId } };

    // The payload
    const payload = { line_items, mode, subscription_data, success_url, cancel_url };

    // Create request body for Stripe, with flattened + encoded params
    const body = new URLSearchParams(flattenObject(payload)).toString();

    // Execute POST request to Stripe
    const res = await fetch(STRIPE_ENDPOINT, { method: 'POST', headers, body });
    const data = await res.json();

    // Handle response
    if (!res.ok || !data?.url) {
      const msg = data?.error?.message || data?.error || 'Failed to create checkout session';
      throw new Error(`Stripe Error: ${msg}`);
    }
    return { url: data.url };

  } catch (err: any) { // Handle fuck up, with error code and message
    return event.res
      ? (event.res.statusCode = 400, { error: err.message })
      : { error: err.message };
  }
});
