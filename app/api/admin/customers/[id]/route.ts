import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';

/**
 * GET /api/admin/customers/[id]
 * Get customer details by id (phone or legacy User _id) with all bills
 */
export async function GET(
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

    const bills = await Bill.find({ customerPhone: id }).sort({ createdAt: -1 }).lean();

    if (!bills || bills.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const first = bills[0];
    const customer = {
      id: first.customerPhone || id,
      name: first.customerName || '',
      email: '',
      phone: first.customerPhone || id,
      address: first.customerAddress || '',
      isVerified: true,
      createdAt: first.createdAt,
    };

    const totalBills = bills.length;
    const paidBills = bills.filter((b: any) => b.status === 'paid').length;
    const pendingBills = bills.filter((b: any) => b.status === 'pending' || b.status === 'partial').length;
    const totalOutstanding = bills
      .filter((b: any) => b.status === 'pending' || b.status === 'partial')
      .reduce((sum: number, bill: any) => sum + (bill.outstandingAmount || 0), 0);
    const totalPaid = bills.reduce((sum: number, bill: any) => sum + (bill.paidAmount || 0), 0);
    const totalAmount = bills.reduce((sum: number, bill: any) => sum + (bill.grandTotal || 0), 0);

    return NextResponse.json(
      {
        success: true,
        customer,
        bills: bills || [],
        summary: {
          totalBills,
          paidBills,
          pendingBills,
          totalAmount,
          totalPaid,
          outstandingBalance: totalOutstanding,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get customer details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch customer details',
      },
      { status: 500 }
    );
  }
}
