interface Env { CMS: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const row = await env.CMS.prepare(
    'SELECT * FROM articles WHERE slug = ? AND published = 1'
  ).bind(params.slug).first();
  if (!row) return Response.json(null, { status: 404 });
  return Response.json(row);
};
