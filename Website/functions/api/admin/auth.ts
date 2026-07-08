interface Env { ADMIN_PASSWORD: string; }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { password } = await request.json() as { password: string };
  if (password === env.ADMIN_PASSWORD) return Response.json({ ok: true });
  return Response.json({ ok: false }, { status: 401 });
};
