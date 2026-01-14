import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import mongoose from 'mongoose';

/**
 * POST /api/bills
 * Create a new bill (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Debug logging
    console.log('Received body type:', typeof body);
    console.log('Items type:', typeof body.items);
    console.log('Items value:', body.items);
    
    let {
      billNumber,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      grandTotal,
    } = body;

    // Parse items if it's a string (shouldn't happen, but handle it)
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
        console.log('Parsed items from string:', items);
      } catch (parseError) {
        console.error('Failed to parse items string:', parseError);
        return NextResponse.json(
          { success: false, error: 'Invalid items format' },
          { status: 400 }
        );
      }
    }

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

    // Validate items is an array and not empty
    if (!Array.isArray(items)) {
      console.error('Items is not an array. Type:', typeof items, 'Value:', items);
      return NextResponse.json(
        { success: false, error: `Items must be an array. Received: ${typeof items}` },
        { status: 400 }
      );
    }
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array cannot be empty' },
        { status: 400 }
      );
    }

    // Convert productId strings to ObjectIds and ensure all required fields
    let formattedItems;
    try {
      formattedItems = items.map((item: any) => {
        // Validate item structure
        if (!item || typeof item !== 'object') {
          throw new Error(`Invalid item format: ${JSON.stringify(item)}`);
        }
        if (!item.productId) {
          throw new Error('Item missing productId');
        }
        if (!item.name) {
          throw new Error('Item missing name');
        }
        
        // Convert productId to ObjectId
        let productIdObj;
        if (item.productId instanceof mongoose.Types.ObjectId) {
          productIdObj = item.productId;
        } else if (mongoose.Types.ObjectId.isValid(item.productId)) {
          productIdObj = new mongoose.Types.ObjectId(item.productId);
        } else {
          throw new Error(`Invalid productId: ${item.productId}`);
        }
        
        return {
          productId: productIdObj,
          name: String(item.name),
          brand: String(item.brand || ''),
          type: String(item.type || ''),
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.total || (item.price * item.quantity)),
        };
      });
    } catch (formatError: any) {
      console.error('Error formatting items:', formatError);
      return NextResponse.json(
        { success: false, error: `Error formatting items: ${formatError.message}` },
        { status: 400 }
      );
    }

    // Log formatted items before creating bill (ObjectIds will show as strings in JSON)
    console.log('Formatted items count:', formattedItems.length);
    console.log('First item productId type:', formattedItems[0]?.productId?.constructor?.name);
    console.log('First item productId value:', formattedItems[0]?.productId?.toString());
    
    // Create bill - ensure items is a plain array of objects
    try {
      // Create a new Bill instance to ensure proper schema handling
      const billData = {
        billNumber,
        customerName,
        customerPhone,
        customerAddress: customerAddress || '',
        items: formattedItems,
        subtotal: Number(subtotal),
        grandTotal: Number(grandTotal),
        paidAmount: 0,
        outstandingAmount: Number(grandTotal),
        status: 'pending' as const,
      };
      
      console.log('Bill data items type:', typeof billData.items);
      console.log('Bill data items is array:', Array.isArray(billData.items));
      
      const bill = await Bill.create(billData);

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
    } catch (createError: any) {
      console.error('Bill.create() error:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      throw createError;
    }

  } catch (error: any) {
    console.error('Create bill error:', error);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create bill',
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined,
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
