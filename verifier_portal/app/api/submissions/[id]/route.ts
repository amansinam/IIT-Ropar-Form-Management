const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return Response.json({ error: 'BACKEND_URL is not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/api/submissions/${id}`, {
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
    console.error('[VerifierPortal submission proxy GET] Error:', error);
    return Response.json({ error: 'Failed to fetch submission details' }, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return Response.json({ error: 'BACKEND_URL is not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/api/submissions/${id}`, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') ?? 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: await request.text(),
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
    console.error('[VerifierPortal submission proxy POST] Error:', error);
    return Response.json({ error: 'Failed to update submission' }, { status: 502 });
  }
}
