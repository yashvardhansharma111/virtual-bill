import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTPEmail, generateOTP } from '@/lib/email';

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, 'verification');
    } catch (emailError: any) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send OTP email. Please check your SMTP configuration.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully. Please check your email.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to resend OTP',
      },
      { status: 500 }
    );
  }
}
