import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendOutstandingBalanceSMS, sendCustomSMS } from '@/lib/sms';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * POST /api/admin/sms/send
 * Send SMS to customer
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;

    if (adminSession !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, phone, message, type, outstandingAmount } = await request.json();

    // Validation
    if (!phone && !userId) {
      return NextResponse.json(
        { success: false, error: 'Phone number or user ID is required' },
        { status: 400 }
      );
    }

    let targetPhone = phone;
    let customerName = 'Customer';

    // If userId is provided, get user details
    if (userId) {
      await connectDB();
      const user = await User.findById(userId).select('name phone').lean();
      if (user) {
        targetPhone = user.phone;
        customerName = user.name || 'Customer';
      } else {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    if (!targetPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Send SMS based on type
    let result;
    if (type === 'outstanding' && outstandingAmount) {
      result = await sendOutstandingBalanceSMS(targetPhone, customerName, outstandingAmount);
    } else if (message) {
      result = await sendCustomSMS(targetPhone, message, customerName);
    } else {
      return NextResponse.json(
        { success: false, error: 'Message or outstanding amount is required' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'SMS sent successfully',
          messageId: result.messageId,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send SMS',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send SMS',
      },
      { status: 500 }
    );
  }
}
