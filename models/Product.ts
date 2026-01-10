import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Product Interface
 */
export interface IProduct extends Document {
  name: string;
  type: string;
  price: number;
  brand: string;
  stockQuantity: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Schema
 */
const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Product type is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity must be positive'],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better search performance
// Single field indexes for filtering and sorting
ProductSchema.index({ type: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ name: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
