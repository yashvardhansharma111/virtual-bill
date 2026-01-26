import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * GET /api/products/suggestions
 * Get product name suggestions for autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    // Search for product names, brands, and types that match the query
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name brand type')
      .limit(10)
      .lean();

    // Extract unique suggestions
    const suggestions = new Set<string>();
    products.forEach((product) => {
      if (product.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.name);
      }
      if (product.brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.brand);
      }
      if (product.type.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.type);
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: Array.from(suggestions).slice(0, 8), // Limit to 8 suggestions
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch suggestions',
        data: [],
      },
      { status: 500 }
    );
  }
}
