interface Env {
  MAILGUN_API_KEY: string;
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

    // Verify Turnstile token if secret key is configured
    if (env.TURNSTILE_SECRET_KEY && cfToken) {
      const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: cfToken }),
      });
      const tsData = await tsRes.json() as { success: boolean };
      if (!tsData.success) {
        return Response.json({ success: false, code: 403 }, { status: 403 });
      }
    }

    const subjectLine = subject?.trim() || 'General enquiry';

    const fd = new FormData();
    fd.append('from', 'HTMLedger Contact <contact@noreply.localhost314.com>');
    fd.append('to', 'REDACTED');
    fd.append('subject', `[HTMLedger] ${subjectLine}`);
    fd.append('text', `Name: ${name}\nEmail: ${email}\nSubject: ${subjectLine}\n\n${message}`);
    fd.append('h:Reply-To', `${name} <${email}>`);

    const mgRes = await fetch(
      'https://api.mailgun.net/v3/noreply.localhost314.com/messages',
      {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}` },
        body: fd,
      }
    );

    if (!mgRes.ok) {
      console.error('Mailgun error:', await mgRes.text());
      return Response.json({ success: false, code: 502 }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return Response.json({ success: false, code: 500 }, { status: 500 });
  }
};
