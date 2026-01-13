import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 200 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

      await connectDB();
      const user = await User.findById(decoded.userId).select('-password -otp');

      if (!user) {
        return NextResponse.json(
          { success: false, authenticated: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address || '',
          },
        },
        { status: 200 }
      );
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: error.message || 'Failed to check authentication',
      },
      { status: 500 }
    );
  }
}
