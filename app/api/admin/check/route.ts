import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/check
 * Check if admin is authenticated
 */
export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session');

  if (adminSession && adminSession.value === 'authenticated') {
    return NextResponse.json(
      {
        success: true,
        authenticated: true,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      authenticated: false,
    },
    { status: 401 }
  );
}
