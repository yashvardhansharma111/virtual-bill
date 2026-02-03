import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

/**
 * GET /api/products
 * Fetch all products with optional search, filter, and sort
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB with timeout handling
    try {
      await connectDB();
    } catch (dbError: any) {
      // Check for authentication errors specifically
      const isAuthError = 
        dbError.message?.includes('bad auth') ||
        dbError.message?.includes('authentication failed') ||
        dbError.message?.includes('Authentication failed') ||
        dbError.code === 8000 || // MongoDB authentication error code
        dbError.codeName === 'AuthenticationFailed';

      // Check for other MongoDB connection errors
      const isMongoError = 
        dbError.name === 'MongoServerError' || 
        dbError.name === 'MongooseError' ||
        dbError.name === 'MongooseServerSelectionError' ||
        dbError.name === 'MongoNetworkError' ||
        dbError.message?.includes('ECONNREFUSED') ||
        dbError.message?.includes('MongoDB') ||
        dbError.message?.includes('timeout') ||
        dbError.code === 'ECONNREFUSED' ||
        isAuthError;

      if (isAuthError) {
        return NextResponse.json(
          {
            success: false,
            error: 'MongoDB Atlas authentication failed. Please check your username, password, and ensure your IP is whitelisted in Atlas. Also verify the database name is included in the connection string (e.g., /virtualbill).',
            data: [],
            count: 0,
          },
          { status: 200 }
        );
      }

      if (isMongoError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database connection error. Please check your MongoDB Atlas connection string and network settings.',
            data: [],
            count: 0,
          },
          { status: 200 }
        );
      }
      throw dbError; // Re-throw if it's not a connection error
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query
    let query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'price') {
      sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'type') {
      sort.type = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Fetch products - handle empty result gracefully
    const products = await Product.find(query).sort(sort).lean();

    // Return empty array if no products found (not an error)
    return NextResponse.json(
      {
        success: true,
        data: products || [],
        count: products?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // Handle MongoDB connection errors - check for various MongoDB error types
    const isMongoError = 
      error.name === 'MongoServerError' || 
      error.name === 'MongooseError' ||
      error.name === 'MongooseServerSelectionError' ||
      error.name === 'MongoNetworkError' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('MongoDB') ||
      error.code === 'ECONNREFUSED';

    if (isMongoError) {
      // Return 200 with success: false so frontend can handle gracefully
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection error. Please ensure MongoDB is running and check your connection settings.',
          data: [],
          count: 0,
        },
        { status: 200 } // Return 200 so frontend doesn't treat it as a server error
      );
    }

    // Handle other errors - still return 200 with error message
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch products',
        data: [],
        count: 0,
      },
      { status: 200 } // Return 200 so frontend can handle it
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const price = parseFloat(formData.get('price') as string);
    const brand = formData.get('brand') as string;
    const stockQuantity = parseInt(formData.get('stockQuantity') as string);
    const imageFile = formData.get('image') as File | null;

    // Validate required fields (image is optional)
    if (!name || !type || !price || !brand || !stockQuantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, type, price, brand and stock quantity are required',
        },
        { status: 400 }
      );
    }

    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = await imageFile.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const imageDataUri = `data:${imageFile.type};base64,${imageBase64}`;
      imageUrl = await uploadImage(imageDataUri);
    }

    // Create product
    const product = await Product.create({
      name,
      type,
      price,
      brand,
      stockQuantity,
      image: imageUrl,
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
      },
      { status: 500 }
    );
  }
}
