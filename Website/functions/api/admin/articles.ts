import { authed, unauthorized } from '../../_shared/auth';

interface Env { CMS: D1Database; ADMIN_PASSWORD: string; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const { results } = await env.CMS.prepare(
    'SELECT id, slug, title, summary, style, pinned, archived, archived_at, archive_reason, published, created_at FROM articles ORDER BY pinned DESC, created_at DESC'
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();
  const { slug, title, summary, body, style, published } = await request.json() as Record<string, string>;
  await env.CMS.prepare(
    'INSERT INTO articles (slug, title, summary, body, style, published) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(slug, title, summary ?? '', body, style ?? 'plain', published ? 1 : 0).run();
  return Response.json({ ok: true });
};
