import { authed, unauthorized } from '../../../_shared/auth';

interface Env { CMS: D1Database; ADMIN_PASSWORD: string; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!authed(request, env)) return unauthorized();
  const row = await env.CMS.prepare('SELECT * FROM articles WHERE id = ?').bind(params.id).first();
  if (!row) return Response.json(null, { status: 404 });
  return Response.json(row);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!authed(request, env)) return unauthorized();
  const { slug, title, summary, body, published } = await request.json() as Record<string, string>;
  await env.CMS.prepare(
    'UPDATE articles SET slug=?, title=?, summary=?, body=?, published=?, updated_at=datetime(\'now\') WHERE id=?'
  ).bind(slug, title, summary ?? '', body, published ? 1 : 0, params.id).run();
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!authed(request, env)) return unauthorized();
  await env.CMS.prepare('DELETE FROM articles WHERE id = ?').bind(params.id).run();
  return Response.json({ ok: true });
};
