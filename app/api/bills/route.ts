import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/bills
 * Create a new bill
 */
export async function POST(request: NextRequest) {
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

      const {
        billNumber,
        customerName,
        customerVillage,
        items,
        subtotal,
        grandTotal,
      } = await request.json();

      // Validation
      if (!billNumber || !customerName || !items || !grandTotal) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
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
        userId: decoded.userId,
        customerName,
        customerVillage: customerVillage || '',
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
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
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
 * Get bills for authenticated user or all bills for admin
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const adminSession = request.cookies.get('admin_session')?.value;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query: any = {};

    // If admin session, allow viewing all bills or filter by userId
    if (adminSession === 'authenticated') {
      if (userId) {
        query.userId = userId;
      }
    } else if (token) {
      // Regular user can only see their own bills
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
        query.userId = decoded.userId;
      } catch (jwtError) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (status) {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
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
