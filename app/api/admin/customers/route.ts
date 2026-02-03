import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';

/**
 * GET /api/admin/customers
 * Get all customers derived from Bills (so new order submissions appear here)
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
    const search = (searchParams.get('search') || '').trim();

    // Aggregate customers from bills (group by customerPhone)
    const bills = await Bill.find({})
      .sort({ createdAt: -1 })
      .lean();

    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        totalBills: number;
        paidBills: number;
        pendingBills: number;
        outstandingBalance: number;
        createdAt: string;
      }
    >();

    for (const bill of bills) {
      const phone = (bill.customerPhone || '').trim();
      if (!phone) continue;

      const existing = customerMap.get(phone);
      const isPaid = bill.status === 'paid';
      const outstanding = bill.outstandingAmount ?? bill.grandTotal - (bill.paidAmount ?? 0);

      if (!existing) {
        customerMap.set(phone, {
          id: phone,
          name: bill.customerName || '',
          email: '',
          phone,
          address: bill.customerAddress || '',
          totalBills: 1,
          paidBills: isPaid ? 1 : 0,
          pendingBills: isPaid ? 0 : 1,
          outstandingBalance: outstanding > 0 ? outstanding : 0,
          createdAt: (bill.createdAt as Date)?.toISOString?.() || '',
        });
      } else {
        existing.totalBills += 1;
        if (isPaid) existing.paidBills += 1;
        else existing.pendingBills += 1;
        existing.outstandingBalance += outstanding > 0 ? outstanding : 0;
        if (bill.customerName) existing.name = bill.customerName;
        if (bill.customerAddress) existing.address = bill.customerAddress;
      }
    }

    let customers = Array.from(customerMap.values());

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    customers.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    return NextResponse.json(
      {
        success: true,
        data: customers,
        count: customers.length,
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
