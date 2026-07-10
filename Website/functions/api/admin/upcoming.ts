import { authed, unauthorized } from '../../_shared/auth';

interface Env { CMS: D1Database; ADMIN_PASSWORD: string; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const { results } = await env.CMS.prepare(
    'SELECT * FROM future_plans ORDER BY sort_order ASC'
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const { title, description, status, sort_order } = await request.json() as Record<string, string>;
  await env.CMS.prepare(
    'INSERT INTO future_plans (title, description, status, sort_order) VALUES (?, ?, ?, ?)'
  ).bind(title, description, status ?? 'planned', Number(sort_order) || 0).run();
  return Response.json({ ok: true });
};
