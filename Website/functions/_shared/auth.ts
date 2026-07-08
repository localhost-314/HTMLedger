export function authed(request: Request, env: { ADMIN_PASSWORD: string }): boolean {
  const header = request.headers.get('Authorization') ?? '';
  return header === `Bearer ${env.ADMIN_PASSWORD}`;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
