import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Bill from '@/models/Bill';

/**
 * GET /api/admin/customers/[id]
 * Get customer details with all bills and outstanding balance
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

    const user = await User.findById(id).select('-password -otp -resetPasswordToken').lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get all bills for this customer
    const bills = await Bill.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate totals
    const totalBills = bills.length;
    const paidBills = bills.filter((b) => b.status === 'paid').length;
    const pendingBills = bills.filter((b) => b.status === 'pending' || b.status === 'partial').length;
    const totalOutstanding = bills
      .filter((b) => b.status === 'pending' || b.status === 'partial')
      .reduce((sum, bill) => sum + (bill.outstandingAmount || 0), 0);
    const totalPaid = bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
    const totalAmount = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address || '',
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
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
