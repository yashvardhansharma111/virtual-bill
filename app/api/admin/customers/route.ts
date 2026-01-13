import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Bill from '@/models/Bill';

/**
 * GET /api/admin/customers
 * Get all customers with their outstanding balances
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
    const search = searchParams.get('search') || '';

    // Build query
    let userQuery: any = {};
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(userQuery)
      .select('-password -otp -resetPasswordToken')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate outstanding balance for each user
    const customersWithBalance = await Promise.all(
      users.map(async (user) => {
        const bills = await Bill.find({
          userId: user._id,
          status: { $in: ['pending', 'partial'] },
        }).lean();

        const totalOutstanding = bills.reduce(
          (sum, bill) => sum + (bill.outstandingAmount || 0),
          0
        );

        const totalBills = await Bill.countDocuments({ userId: user._id });
        const paidBills = await Bill.countDocuments({
          userId: user._id,
          status: 'paid',
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address || '',
          isVerified: user.isVerified,
          totalBills,
          paidBills,
          pendingBills: totalBills - paidBills,
          outstandingBalance: totalOutstanding,
          createdAt: user.createdAt,
        };
      })
    );

    // Sort by outstanding balance (highest first)
    customersWithBalance.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    return NextResponse.json(
      {
        success: true,
        data: customersWithBalance,
        count: customersWithBalance.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch customers',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
