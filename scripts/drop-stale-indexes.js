/**
 * Script to drop stale indexes from the users collection
 * Run this once to clean up old indexes: node scripts/drop-stale-indexes.js
 * 
 * Make sure MONGODB_URI is set in your environment or .env.local file
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Try to load .env.local or .env if it exists
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    break;
  }
}

async function dropStaleIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop stale indexes
    const validIndexes = ['_id_', 'email_1', 'phone_1'];
    let droppedCount = 0;

    for (const index of indexes) {
      if (!validIndexes.includes(index.name)) {
        try {
          await collection.dropIndex(index.name);
          console.log(`\n✅ Dropped stale index: ${index.name}`);
          droppedCount++;
        } catch (err) {
          if (err.code === 27) {
            console.log(`\n⚠️  Index ${index.name} doesn't exist (already dropped)`);
          } else {
            console.error(`\n❌ Error dropping index ${index.name}:`, err.message);
          }
        }
      }
    }

    if (droppedCount === 0) {
      console.log('\n✅ No stale indexes found. Database is clean!');
    } else {
      console.log(`\n✅ Successfully dropped ${droppedCount} stale index(es)`);
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropStaleIndexes();
