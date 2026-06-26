interface Env { TURNSTILE_SITE_KEY: string; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({ siteKey: env.TURNSTILE_SITE_KEY ?? '' });
};
