interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ContactBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
  platform?: string;
  cfToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as ContactBody;
    const { name, email, subject, message, cfToken } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json({ success: false, code: 400 }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, code: 422 }, { status: 422 });
    }

    // Verify Turnstile token — non-blocking: ad blockers corrupt tokens, so we log
    // failures and continue rather than hard-rejecting legitimate users.
    if (env.TURNSTILE_SECRET_KEY && cfToken) {
      try {
        const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: cfToken }),
        });
        const tsData = await tsRes.json() as { success: boolean };
        if (!tsData.success) {
          console.warn('Turnstile verification failed (continuing):', tsData);
        }
      } catch (tsErr) {
        console.warn('Turnstile check error (continuing):', tsErr);
      }
    }

    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return Response.json({ success: false, code: 503 }, { status: 503 });
    }

    const subjectLine = subject?.trim() || 'General enquiry';
    const platformTag = body.platform ? `[${body.platform}]` : '[HTMLedger]';

    const rsRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HTMLedger Contact <contact@email.localhost314.com>',
        to: ['tristanarbet@gmail.com'],
        reply_to: `${name} <${email}>`,
        subject: `${platformTag} ${subjectLine}`,
        text: `App: ${body.platform || 'Not specified'}\nName: ${name}\nEmail: ${email}\nSubject: ${subjectLine}\n\n${message}`,
      }),
    });

    if (!rsRes.ok) {
      console.error('Resend error:', await rsRes.text());
      return Response.json({ success: false, code: 502 }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return Response.json({ success: false, code: 500 }, { status: 500 });
  }
};
