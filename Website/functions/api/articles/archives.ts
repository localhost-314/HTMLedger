interface Env { CMS: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.CMS.prepare(
    'SELECT id, slug, title, summary, archived_at, archive_reason, created_at FROM articles WHERE published = 1 AND archived = 1 ORDER BY archived_at DESC'
  ).all();
  return Response.json(results);
};
