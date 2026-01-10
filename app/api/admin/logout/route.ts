import { NextResponse } from 'next/server';

/**
 * POST /api/admin/logout
 * Admin logout endpoint
 */
export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logout successful',
    },
    { status: 200 }
  );

  // Clear admin session cookie
  response.cookies.delete('admin_session');

  return response;
}
