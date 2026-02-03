import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';

/**
 * GET /api/admin/customers/lookup?phone=xxx
 * Look up customer by phone from latest bill (for auto-fill name, address)
 */
export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;

    if (adminSession !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = (searchParams.get('phone') || '').trim();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number required' },
        { status: 400 }
      );
    }

    await connectDB();

    const bill = await Bill.findOne({ customerPhone: phone })
      .sort({ createdAt: -1 })
      .select('customerName customerPhone customerAddress')
      .lean();

    if (!bill) {
      return NextResponse.json(
        { success: true, data: null, message: 'No previous orders for this number' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          customerName: bill.customerName || '',
          customerPhone: bill.customerPhone || phone,
          customerAddress: bill.customerAddress || '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Customer lookup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lookup failed' },
      { status: 500 }
    );
  }
}
