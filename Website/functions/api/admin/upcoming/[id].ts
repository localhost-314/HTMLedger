import { authed, unauthorized } from '../../../_shared/auth';

interface Env { CMS: D1Database; ADMIN_PASSWORD: string; }

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!authed(request, env)) return unauthorized();
  const { title, description, status, sort_order } = await request.json() as Record<string, string>;
  await env.CMS.prepare(
    'UPDATE future_plans SET title=?, description=?, status=?, sort_order=? WHERE id=?'
  ).bind(title, description, status, Number(sort_order) || 0, params.id).run();
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!authed(request, env)) return unauthorized();
  await env.CMS.prepare('DELETE FROM future_plans WHERE id = ?').bind(params.id).run();
  return Response.json({ ok: true });
};
