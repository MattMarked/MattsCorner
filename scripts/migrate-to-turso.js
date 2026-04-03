#!/usr/bin/env node

/**
 * Migration script to move data from local SQLite to Turso
 * 
 * Usage:
 * 1. Set up your Turso database and get credentials
 * 2. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to your .env.local
 * 3. Run: node scripts/migrate-to-turso.js
 */

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing Turso credentials. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local');
    process.exit(1);
  }

  console.log('🚀 Starting migration from SQLite to Turso...\n');

  // Connect to local SQLite database
  const localDbPath = path.join(process.cwd(), 'database', 'restaurants.db');
  let localDb;
  
  try {
    localDb = new Database(localDbPath);
    console.log('✅ Connected to local SQLite database');
  } catch (error) {
    console.error('❌ Failed to connect to local database:', error.message);
    process.exit(1);
  }

  // Connect to Turso database
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Test connection
    await tursoClient.execute('SELECT 1');
    console.log('✅ Connected to Turso database\n');
  } catch (error) {
    console.error('❌ Failed to connect to Turso:', error.message);
    localDb.close();
    process.exit(1);
  }

  try {
    // Create tables in Turso
    console.log('📋 Creating tables in Turso...');
    
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        google_maps_url TEXT NOT NULL UNIQUE,
        instagram_url TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category)`);
    await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_completed ON restaurants(is_completed)`);
    await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants(latitude, longitude)`);
    
    console.log('✅ Tables and indexes created\n');

    // Migrate restaurants data
    console.log('📊 Migrating restaurants data...');
    
    const restaurants = localDb.prepare('SELECT * FROM restaurants').all();
    console.log(`Found ${restaurants.length} restaurants to migrate`);

    if (restaurants.length > 0) {
      // Batch insert for better performance
      const statements = restaurants.map(restaurant => ({
        sql: `
          INSERT OR REPLACE INTO restaurants (
            id, name, description, category, is_completed, 
            google_maps_url, instagram_url, latitude, longitude, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          restaurant.id,
          restaurant.name,
          restaurant.description,
          restaurant.category,
          restaurant.is_completed,
          restaurant.google_maps_url,
          restaurant.instagram_url,
          restaurant.latitude,
          restaurant.longitude,
          restaurant.created_at,
          restaurant.updated_at
        ]
      }));

      await tursoClient.batch(statements);
      console.log(`✅ Migrated ${restaurants.length} restaurants`);
    }

    // Migrate categories data if it exists
    try {
      const categories = localDb.prepare('SELECT * FROM categories').all();
      if (categories.length > 0) {
        console.log(`📂 Migrating ${categories.length} categories...`);
        
        const categoryStatements = categories.map(category => ({
          sql: `INSERT OR REPLACE INTO categories (id, name, created_at) VALUES (?, ?, ?)`,
          args: [category.id, category.name, category.created_at]
        }));

        await tursoClient.batch(categoryStatements);
        console.log(`✅ Migrated ${categories.length} categories`);
      }
    } catch (error) {
      console.log('ℹ️ No categories table found or empty - skipping');
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const tursoCount = await tursoClient.execute('SELECT COUNT(*) as count FROM restaurants');
    const localCount = localDb.prepare('SELECT COUNT(*) as count FROM restaurants').get();
    
    console.log(`Local database: ${localCount.count} restaurants`);
    console.log(`Turso database: ${tursoCount.rows[0].count} restaurants`);
    
    if (Number(tursoCount.rows[0].count) === localCount.count) {
      console.log('✅ Migration verification successful!\n');
      
      console.log('🎉 Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update your imports to use database-turso.ts');
      console.log('2. Deploy to Vercel with Turso environment variables');
      console.log('3. Test your application');
      console.log('\nOptional: Keep local SQLite for development by not setting Turso env vars locally');
    } else {
      console.error('❌ Migration verification failed - row counts do not match');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    localDb.close();
  }
}

// Run migration
migrate().catch(console.error);