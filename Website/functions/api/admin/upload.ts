import { authed, unauthorized } from '../../_shared/auth';

interface Env { MEDIA: R2Bucket; ADMIN_PASSWORD: string; }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return unauthorized();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (!allowed.includes(ext)) return Response.json({ error: 'File type not allowed' }, { status: 400 });

  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ url: `/api/media/${key}` });
};
