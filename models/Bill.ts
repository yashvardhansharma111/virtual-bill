import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBill extends Document {
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    brand: string;
    type: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema: Schema = new Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
      default: '',
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        brand: String,
        type: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

BillSchema.index({ customerName: 1 });
BillSchema.index({ customerPhone: 1 });
BillSchema.index({ status: 1 });
BillSchema.index({ createdAt: -1 });

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
