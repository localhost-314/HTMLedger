interface Env {
  MAILGUN_API_KEY: string;
}

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as ContactBody;
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const fd = new FormData();
    fd.append('from', 'HTMLedger Contact <contact@noreply.localhost314.com>');
    fd.append('to', 'tristanarbet@gmail.com');
    fd.append('subject', `[HTMLedger] ${subject}`);
    fd.append('text', `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`);
    fd.append('h:Reply-To', `${name} <${email}>`);

    const mgRes = await fetch(
      'https://api.mailgun.net/v3/noreply.localhost314.com/messages',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        },
        body: fd,
      }
    );

    if (!mgRes.ok) {
      console.error('Mailgun error:', await mgRes.text());
      return Response.json({ error: 'Email delivery failed. Please try again.' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
};
