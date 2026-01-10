import mongoose from 'mongoose';

/**
 * MongoDB connection utility
 * Connects to MongoDB Atlas (cloud) or local MongoDB using the connection string from environment variables
 */
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return uri;
}

// Check if using MongoDB Atlas (cloud) or local
function isMongoAtlas(uri: string): boolean {
  return uri.includes('mongodb.net') || uri.includes('mongodb+srv://');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to prevent multiple connections in development
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = getMongoUri();
    const isAtlas = isMongoAtlas(mongoUri);

    // Different connection options for Atlas (cloud) vs local MongoDB
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    if (isAtlas) {
      // MongoDB Atlas (cloud) - longer timeouts for network latency
      opts.serverSelectionTimeoutMS = 10000; // 10 seconds for Atlas
      opts.socketTimeoutMS = 45000;
      opts.connectTimeoutMS = 10000;
      opts.retryWrites = true;
      opts.retryReads = true;
    } else {
      // Local MongoDB - faster timeouts
      opts.serverSelectionTimeoutMS = 2000; // 2 seconds for local
      opts.socketTimeoutMS = 2000;
      opts.connectTimeoutMS = 2000;
    }

    const connectionPromise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log(`✅ MongoDB ${isAtlas ? 'Atlas' : 'Local'} Connected`);
      return mongoose;
    }).catch((error) => {
      // Provide more specific error messages
      if (error.message?.includes('bad auth') || error.message?.includes('authentication failed')) {
        console.error(`❌ MongoDB ${isAtlas ? 'Atlas' : 'Local'} Authentication Error:`, error.message);
        console.error('💡 Tip: Check your username, password, and ensure your IP is whitelisted in MongoDB Atlas.');
        console.error('💡 Also verify the connection string includes the database name (e.g., /virtualbill).');
      } else {
        console.error(`❌ MongoDB ${isAtlas ? 'Atlas' : 'Local'} Connection Error:`, error.message || error);
      }
      cached.promise = null;
      throw error;
    });

    // Only add timeout race for local MongoDB (not for Atlas)
    if (!isAtlas) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('MongoDB connection timeout. Please check if MongoDB is running.'));
        }, 2000);
      });
      cached.promise = Promise.race([connectionPromise, timeoutPromise]);
    } else {
      cached.promise = connectionPromise;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
