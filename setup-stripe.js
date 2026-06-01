/**
 * Run once to create Stripe products and prices.
 * Usage: STRIPE_SECRET_KEY=sk_test_... node setup-stripe.js
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  console.log('Creating Stripe products and prices...\n');

  // Free Trial (Essentials) — $97/mo, 14-day trial
  const essentials = await stripe.products.create({
    name: 'Aesthetic Content Club — Free Trial (Essentials)',
    description: '14-day free trial, then $97/month. Access to the monthly Pixieset content library.',
  });
  const essentialsPrice = await stripe.prices.create({
    product: essentials.id,
    unit_amount: 9700,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // Unlimited (Founding Member) — $300/mo
  const founding = await stripe.products.create({
    name: 'Aesthetic Content Club — Unlimited (Founding Member)',
    description: 'Full vault access, unlimited downloads. Founding rate locked for 6 months.',
  });
  const foundingPrice = await stripe.prices.create({
    product: founding.id,
    unit_amount: 30000,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // Studio — $197/mo
  const studio = await stripe.products.create({
    name: 'Aesthetic Content Club — Studio',
  });
  const studioPrice = await stripe.prices.create({
    product: studio.id,
    unit_amount: 19700,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // Clinic — $297/mo
  const clinic = await stripe.products.create({
    name: 'Aesthetic Content Club — Clinic',
  });
  const clinicPrice = await stripe.prices.create({
    product: clinic.id,
    unit_amount: 29700,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Add these to Netlify environment variables:\n');
  console.log(`STRIPE_PRICE_ESSENTIALS=${essentialsPrice.id}`);
  console.log(`STRIPE_PRICE_STUDIO=${studioPrice.id}`);
  console.log(`STRIPE_PRICE_CLINIC=${clinicPrice.id}`);
  console.log(`STRIPE_PRICE_FOUNDING=${foundingPrice.id}`);
  console.log('\nDone.');
}

main().catch(console.error);
