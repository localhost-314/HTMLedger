import { authed, unauthorized } from '../../_shared/auth';

interface Env { BANNERS: KVNamespace; ADMIN_PASSWORD: string; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const raw = await env.BANNERS.get('current');
  return Response.json(raw ? JSON.parse(raw) : null);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const body = await request.json();
  await env.BANNERS.put('current', JSON.stringify(body));
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  await env.BANNERS.delete('current');
  return Response.json({ ok: true });
};
