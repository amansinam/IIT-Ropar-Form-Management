const BACKEND_URL = process.env.BACKEND_URL;

type AllSubmissionsPayload = {
  submissions?: unknown[];
  stats?: {
    total?: number;
    pending?: number;
    accepted?: number;
    rejected?: number;
    expired?: number;
  };
  formOptions?: unknown[];
};

function buildSummarySearch(searchParams: URLSearchParams) {
  const summaryParams = new URLSearchParams(searchParams);
  summaryParams.delete('status');
  const summarySearch = summaryParams.toString();
  return summarySearch ? `?${summarySearch}` : '';
}

export async function GET(request: Request) {
  if (!BACKEND_URL) {
    return Response.json({ error: 'BACKEND_URL is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const filteredSearch = url.search;
  const summarySearch = buildSummarySearch(url.searchParams);
  const headers = {
    cookie: request.headers.get('cookie') ?? '',
  };

  try {
    const [filteredResponse, summaryResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/verifier/all-submissions${filteredSearch}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      }),
      fetch(`${BACKEND_URL}/api/verifier/all-submissions${summarySearch}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      }),
    ]);

    if (!filteredResponse.ok) {
      const text = await filteredResponse.text();
      return new Response(text, {
        status: filteredResponse.status,
        headers: {
          'content-type': filteredResponse.headers.get('content-type') ?? 'application/json',
        },
      });
    }

    const filteredJson = await filteredResponse.json() as AllSubmissionsPayload;

    if (!summaryResponse.ok) {
      return Response.json(filteredJson, {
        status: filteredResponse.status,
      });
    }

    const summaryJson = await summaryResponse.json() as AllSubmissionsPayload;

    return Response.json({
      ...filteredJson,
      stats: summaryJson.stats ?? filteredJson.stats,
    });
  } catch (error) {
    console.error('[VerifierPortal all-submissions proxy] Error:', error);
    return Response.json({ error: 'Failed to fetch real submissions data' }, { status: 502 });
  }
}
