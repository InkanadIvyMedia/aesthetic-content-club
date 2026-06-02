const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body || '{}');
    name  = (body.name  || '').trim();
    email = (body.email || '').trim().toLowerCase();
  } catch (_) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!name || !email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name and valid email required' }) };
  }

  const url      = process.env.PIXIESET_URL_ESSENTIALS;
  const password = process.env.PIXIESET_PASSWORD_ESSENTIALS;

  if (!url || !password) {
    console.error('Missing PIXIESET_URL_ESSENTIALS or PIXIESET_PASSWORD_ESSENTIALS');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  const firstName = name.split(' ')[0];

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to:   email,
      subject: 'Your Aesthetic Content Club free access is ready',
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e1d1a;background:#f5f2ec;padding:40px 32px;">
          <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#4a5c3a;margin:0 0 28px;">Aesthetic Content Club</p>
          <h1 style="font-size:28px;font-weight:300;line-height:1.15;margin:0 0 16px;">Hi ${firstName}, your vault is ready.</h1>
          <p style="color:#6b6760;line-height:1.75;margin:0 0 28px;">Here's your free access to this month's content library. Save this email — you'll need the password each time you open the album.</p>

          <div style="background:#fff;border:0.5px solid rgba(30,29,26,0.12);padding:28px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#4a5c3a;">Library Link</p>
            <a href="${url}" style="color:#4a5c3a;font-weight:500;word-break:break-all;">${url}</a>

            <div style="border-top:0.5px solid rgba(30,29,26,0.08);margin:20px 0;"></div>

            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#4a5c3a;">Album Password</p>
            <span style="font-size:20px;letter-spacing:0.15em;font-family:monospace;">${password}</span>
          </div>

          <div style="background:#fff;border-left:3px solid #4a5c3a;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#4a5c3a;line-height:1.6;">Want unlimited downloads and all 150 assets? <a href="https://aesthetic-content-club.netlify.app/#pricing" style="color:#4a5c3a;font-weight:500;">Upgrade to Founding Member →</a></p>
          </div>

          <p style="color:#aaa89f;font-size:12px;line-height:1.7;">Questions? Reply to this email or reach us at hello@aestheticcontent.club.</p>

          <div style="border-top:0.5px solid rgba(30,29,26,0.1);margin:32px 0 0;padding-top:20px;">
            <p style="font-size:11px;color:#aaa89f;margin:0;">© 2026 Aesthetic Content Club &nbsp;·&nbsp; hello@aestheticcontent.club</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend error:', JSON.stringify(result.error));
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    console.log(`Free access email sent to ${email} (${name}) — Resend ID: ${result.data?.id}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('Send error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
  }
};
