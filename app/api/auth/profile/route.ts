import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * GET /api/auth/profile
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      await connectDB();

      const user = await User.findById(decoded.userId).select('-password -otp -resetPasswordToken');

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
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
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      await connectDB();

      const { name, phone, address } = await request.json();

      // Validation
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Name must be at least 2 characters' },
          { status: 400 }
        );
      }

      if (phone && !/^[0-9]{10}$/.test(phone)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 10-digit phone number' },
          { status: 400 }
        );
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if phone is being changed and if it's already taken
      if (phone && phone !== user.phone) {
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
          return NextResponse.json(
            { success: false, error: 'Phone number already registered' },
            { status: 400 }
          );
        }
      }

      // Update user
      user.name = name.trim();
      if (phone) user.phone = phone;
      if (address !== undefined) user.address = address.trim();

      await user.save();

      return NextResponse.json(
        {
          success: true,
          message: 'Profile updated successfully',
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
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
