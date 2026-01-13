import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';

/**
 * POST /api/bills
 * Create a new bill (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const {
      billNumber,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      grandTotal,
    } = await request.json();

    // Validation
    if (!billNumber || !customerName || !customerPhone || !items || !grandTotal) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (billNumber, customerName, customerPhone, items, grandTotal)' },
        { status: 400 }
      );
    }

    // Check if bill number already exists
    const existingBill = await Bill.findOne({ billNumber });
    if (existingBill) {
      return NextResponse.json(
        { success: false, error: 'Bill number already exists' },
        { status: 400 }
      );
    }

    // Create bill
    const bill = await Bill.create({
      billNumber,
      customerName,
      customerPhone,
      customerAddress: customerAddress || '',
      items,
      subtotal,
      grandTotal,
      paidAmount: 0,
      outstandingAmount: grandTotal,
      status: 'pending',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Bill created successfully',
        bill: {
          id: bill._id.toString(),
          billNumber: bill.billNumber,
          grandTotal: bill.grandTotal,
          outstandingAmount: bill.outstandingAmount,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create bill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create bill',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bills
 * Get all bills (admin only) or filter by customer phone/name
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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get('customerPhone');
    const customerName = searchParams.get('customerName');
    const status = searchParams.get('status');

    let query: any = {};

    if (customerPhone) {
      query.customerPhone = customerPhone;
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: bills || [],
        count: bills?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get bills error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch bills',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
