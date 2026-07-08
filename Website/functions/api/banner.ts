interface Env { BANNERS: KVNamespace; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = await env.BANNERS.get('current');
  return Response.json(raw ? JSON.parse(raw) : null);
};
