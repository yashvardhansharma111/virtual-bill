import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTPEmail, generateOTP } from '@/lib/email';

/**
 * POST /api/auth/forgot-password
 * Send OTP to user's email for password reset
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
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: 'If the email exists, an OTP has been sent to your email.',
        },
        { status: 200 }
      );
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, 'reset');
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
        message: 'If the email exists, an OTP has been sent to your email.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
