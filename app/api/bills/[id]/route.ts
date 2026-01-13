import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * PUT /api/bills/[id]
 * Update bill (mainly for payment updates)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSession = request.cookies.get('admin_session')?.value;

    if (adminSession !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { paidAmount } = await request.json();

    const bill = await Bill.findById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Update payment
    bill.paidAmount = paidAmount || 0;
    bill.outstandingAmount = Math.max(0, bill.grandTotal - bill.paidAmount);

    // Update status
    if (bill.outstandingAmount === 0) {
      bill.status = 'paid';
    } else if (bill.paidAmount > 0) {
      bill.status = 'partial';
    } else {
      bill.status = 'pending';
    }

    await bill.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Bill updated successfully',
        bill: {
          id: bill._id.toString(),
          billNumber: bill.billNumber,
          paidAmount: bill.paidAmount,
          outstandingAmount: bill.outstandingAmount,
          status: bill.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update bill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update bill',
      },
      { status: 500 }
    );
  }
}
