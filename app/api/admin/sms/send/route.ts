import { NextRequest, NextResponse } from 'next/server';
import { sendOutstandingBalanceSMS, sendCustomSMS } from '@/lib/sms';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';

/**
 * POST /api/admin/sms/send
 * Send SMS to customer (userId can be phone or legacy User _id)
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

    if (!phone && !userId) {
      return NextResponse.json(
        { success: false, error: 'Phone number or user ID is required' },
        { status: 400 }
      );
    }

    let targetPhone = phone || userId;
    let customerName = 'Customer';

    if (userId && !phone) {
      await connectDB();
      const bill = await Bill.findOne({ customerPhone: String(userId) }).sort({ createdAt: -1 }).select('customerName customerPhone').lean();
      if (bill) {
        targetPhone = bill.customerPhone;
        customerName = bill.customerName || 'Customer';
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
