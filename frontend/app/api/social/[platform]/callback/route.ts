import { NextResponse } from 'next/server';

const BACKEND_API_URL =
  process.env.BACKEND_API_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8000/api/v1';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  const backendUrl = `${BACKEND_API_URL}/social/${platform}/callback?${searchParams.toString()}`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'PressForge-Server',
      },
      redirect: 'manual',
    });

    const locationHeader = backendResponse.headers.get('location');

    if (locationHeader) {
      let targetUrl = locationHeader;

      if (
        targetUrl.startsWith('http://localhost:3000') ||
        targetUrl.startsWith('http://127.0.0.1:3000')
      ) {
        const pathAndQuery = targetUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, '');
        targetUrl = `${requestUrl.origin}${pathAndQuery}`;
      } else if (targetUrl.startsWith('/')) {
        targetUrl = `${requestUrl.origin}${targetUrl}`;
      }

      return NextResponse.redirect(targetUrl, { status: 302 });
    }

    if (!backendResponse.ok) {
      console.error(`Backend OAuth callback returned status ${backendResponse.status}`);
      return NextResponse.redirect(
        `${requestUrl.origin}/app/settings?platform=${platform}&status=error&reason=backend_error`,
        { status: 302 },
      );
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/app/settings?platform=${platform}&status=connected`,
      { status: 302 },
    );
  } catch (error) {
    console.error('OAuth callback proxy error:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/app/settings?platform=${platform}&status=error&reason=proxy_error`,
      { status: 302 },
    );
  }
}
