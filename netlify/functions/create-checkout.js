const Stripe = require('stripe');

const PRICE_IDS = {
  free:       process.env.STRIPE_PRICE_ESSENTIALS,
  essentials: process.env.STRIPE_PRICE_ESSENTIALS,
  studio:     process.env.STRIPE_PRICE_STUDIO,
  clinic:     process.env.STRIPE_PRICE_CLINIC,
  unlimited:  process.env.STRIPE_PRICE_FOUNDING,
  founding:   process.env.STRIPE_PRICE_FOUNDING,
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let tier = 'unlimited';
  try {
    const body = JSON.parse(event.body || '{}');
    tier = body.tier || 'unlimited';
  } catch (_) {}

  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid tier' }) };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = event.headers.origin || 'https://aestheticcontent.club';

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/`,
      metadata: { tier },
    };

    // Free trial: 14-day trial period, no charge today
    if (tier === 'free') {
      sessionParams.subscription_data = { trial_period_days: 14 };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
