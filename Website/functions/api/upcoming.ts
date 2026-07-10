interface Env { CMS: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.CMS.prepare(
    'SELECT id, title, description, status, sort_order FROM future_plans ORDER BY sort_order ASC'
  ).all();
  return Response.json(results);
};
