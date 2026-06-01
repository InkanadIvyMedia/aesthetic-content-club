const Stripe = require('stripe');
const { Resend } = require('resend');

// free and unlimited are the two public tiers; others retained for direct links
const PIXIESET = {
  free:       { url: process.env.PIXIESET_URL_ESSENTIALS,  password: process.env.PIXIESET_PASSWORD_ESSENTIALS },
  essentials: { url: process.env.PIXIESET_URL_ESSENTIALS,  password: process.env.PIXIESET_PASSWORD_ESSENTIALS },
  studio:     { url: process.env.PIXIESET_URL_STUDIO,      password: process.env.PIXIESET_PASSWORD_STUDIO },
  clinic:     { url: process.env.PIXIESET_URL_CLINIC,      password: process.env.PIXIESET_PASSWORD_CLINIC },
  unlimited:  { url: process.env.PIXIESET_URL_FOUNDING,    password: process.env.PIXIESET_PASSWORD_FOUNDING },
  founding:   { url: process.env.PIXIESET_URL_FOUNDING,    password: process.env.PIXIESET_PASSWORD_FOUNDING },
};

const TIER_LABELS = {
  free:       'Free Trial',
  essentials: 'Essentials',
  studio:     'Studio',
  clinic:     'Clinic',
  unlimited:  'Unlimited (Founding Member)',
  founding:   'Founding Member',
};

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'OK' };
  }

  const session  = stripeEvent.data.object;
  const tier     = session.metadata?.tier || 'unlimited';
  const email    = session.customer_details?.email;
  const content  = PIXIESET[tier];
  const label    = TIER_LABELS[tier] || tier;
  const isTrial  = tier === 'free';

  if (!email) {
    console.error('No customer email on session', session.id);
    return { statusCode: 200, body: 'Skipped — no email' };
  }

  if (!content?.url || !content?.password) {
    console.error('Missing Pixieset config for tier:', tier);
    return { statusCode: 200, body: 'Skipped — missing Pixieset config' };
  }

  const trialNote = isTrial
    ? `<p style="background:#f0f4ec;border-left:3px solid #4a5c3a;padding:12px 16px;font-size:13px;color:#4a5c3a;margin:0 0 20px;line-height:1.6;">
        Your <strong>14-day free trial</strong> is now active. No charge until ${new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        After that, your Essentials membership continues at <strong>$97/month</strong> — cancel anytime.
      </p>`
    : '';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'hello@aestheticcontent.club',
      to:   email,
      subject: `Your Aesthetic Content Club access is ready — ${label}`,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e1d1a;background:#f5f2ec;padding:40px 32px;">
          <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#4a5c3a;margin:0 0 28px;">Aesthetic Content Club</p>
          <h1 style="font-size:28px;font-weight:300;line-height:1.15;margin:0 0 16px;">Your vault is ready.</h1>
          ${trialNote}
          <p style="color:#6b6760;line-height:1.75;margin:0 0 28px;">Welcome — you're now a <strong>${label}</strong> member. Below is your access for this month's content library. Save this email; you'll need the password each time you open the album.</p>

          <div style="background:#fff;border:0.5px solid rgba(30,29,26,0.12);padding:28px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#4a5c3a;">Library Link</p>
            <a href="${content.url}" style="color:#4a5c3a;font-weight:500;word-break:break-all;">${content.url}</a>

            <div style="border-top:0.5px solid rgba(30,29,26,0.08);margin:20px 0;"></div>

            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#4a5c3a;">Album Password</p>
            <span style="font-size:20px;letter-spacing:0.15em;font-family:monospace;">${content.password}</span>
          </div>

          <p style="color:#aaa89f;font-size:12px;line-height:1.7;">A new collection drops every 30 days. You'll receive an email when the next vault is live.<br>Questions? Reply to this email or reach us at hello@aestheticcontent.club.</p>

          <div style="border-top:0.5px solid rgba(30,29,26,0.1);margin:32px 0 0;padding-top:20px;">
            <p style="font-size:11px;color:#aaa89f;margin:0;">© 2026 Aesthetic Content Club &nbsp;·&nbsp; hello@aestheticcontent.club</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend delivery error:', JSON.stringify(result.error));
      return { statusCode: 500, body: 'Email send failed: ' + result.error.message };
    }

    console.log(`Access email sent to ${email} for tier "${tier}" — Resend ID: ${result.data?.id}`);
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Resend error:', err.message);
    return { statusCode: 500, body: 'Email send failed' };
  }
};
