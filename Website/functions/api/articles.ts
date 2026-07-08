interface Env { CMS: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.CMS.prepare(
    'SELECT id, slug, title, summary, created_at FROM articles WHERE published = 1 ORDER BY created_at DESC'
  ).all();
  return Response.json(results);
};
