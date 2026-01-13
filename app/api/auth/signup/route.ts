import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendOTPEmail, generateOTP } from '@/lib/email';

/**
 * POST /api/auth/signup
 * Create new user account and send OTP
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, phone, password, address } = await request.json();

    // Validation
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: existingUser.email === email.toLowerCase()
            ? 'Email already registered'
            : 'Phone number already registered',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    // Handle potential index conflicts by catching and providing better error
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        phone,
        address: address?.trim() || '',
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpiry,
      });
    } catch (createError: any) {
      // Handle duplicate key errors (including stale index errors)
      if (createError.code === 11000) {
        const keyPattern = createError.keyPattern || {};
        const keyValue = createError.keyValue || {};
        
        // Check if it's a stale index error (username, etc.)
        if (keyPattern.username || keyValue.username !== undefined) {
          console.error('Stale index error detected. Please drop the username_1 index from the users collection.');
          console.error('Run: node scripts/drop-stale-indexes.js');
          return NextResponse.json(
            {
              success: false,
              error: 'Database configuration error. Please run the migration script to fix this issue.',
              details: 'Stale database index detected. Please contact administrator or run: node scripts/drop-stale-indexes.js',
            },
            { status: 500 }
          );
        }
        
        // Handle actual duplicate email/phone
        if (keyPattern.email) {
          return NextResponse.json(
            { success: false, error: 'Email already registered' },
            { status: 400 }
          );
        }
        
        if (keyPattern.phone) {
          return NextResponse.json(
            { success: false, error: 'Phone number already registered' },
            { status: 400 }
          );
        }
      }
      
      // Re-throw if not a duplicate key error
      throw createError;
    }

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, 'verification');
    } catch (emailError: any) {
      console.error('Failed to send OTP email:', emailError);
      // Still return success, but note email issue
      return NextResponse.json(
        {
          success: false,
          error: 'Account created but failed to send OTP email. Please check your SMTP configuration.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email for OTP.',
        userId: user._id.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create account',
      },
      { status: 500 }
    );
  }
}
