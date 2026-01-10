import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/login
 * Admin login endpoint (hardcoded credentials)
 */
export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    // Hardcoded admin credentials
    const ADMIN_ID = 'admin';
    const ADMIN_PASSWORD = 'admin@123';

    if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
      const response = NextResponse.json(
        {
          success: true,
          message: 'Login successful',
        },
        { status: 200 }
      );

      // Set admin session cookie
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Login failed',
      },
      { status: 500 }
    );
  }
}
