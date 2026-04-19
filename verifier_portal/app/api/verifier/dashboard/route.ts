const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: Request) {
  if (!BACKEND_URL) {
    return Response.json({ error: 'BACKEND_URL is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/verifier/dashboard`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[VerifierPortal dashboard proxy] Error:', error);
    return Response.json({ error: 'Failed to fetch real dashboard data' }, { status: 502 });
  }
}
