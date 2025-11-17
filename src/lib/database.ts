import Database from 'better-sqlite3';
import { Restaurant } from './parser';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure database directory exists
    const dbDir = path.join(process.cwd(), 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'restaurants.db');
    db = new Database(dbPath);
    
    // Initialize tables
    initializeTables();
  }
  
  return db;
}

function initializeTables() {
  if (!db) return;
  
  // Create restaurants table
  db.exec(`
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
  
  // Create categories table for easier filtering
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create index for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category);
    CREATE INDEX IF NOT EXISTS idx_restaurants_completed ON restaurants(is_completed);
  `);
}

export class RestaurantRepository {
  private db: Database.Database;
  
  constructor() {
    this.db = getDatabase();
  }
  
  // Insert or update restaurants
  upsertRestaurant(restaurant: Restaurant): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO restaurants (
        id, name, description, category, is_completed, 
        google_maps_url, instagram_url, latitude, longitude, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      restaurant.id,
      restaurant.name,
      restaurant.description,
      restaurant.category,
      restaurant.isCompleted ? 1 : 0,
      restaurant.googleMapsUrl,
      restaurant.instagramUrl || null,
      restaurant.coordinates?.lat || null,
      restaurant.coordinates?.lng || null
    );
  }
  
  // Batch insert restaurants
  upsertRestaurants(restaurants: Restaurant[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO restaurants (
        id, name, description, category, is_completed, 
        google_maps_url, instagram_url, latitude, longitude, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const transaction = this.db.transaction((restaurants: Restaurant[]) => {
      for (const restaurant of restaurants) {
        stmt.run(
          restaurant.id,
          restaurant.name,
          restaurant.description,
          restaurant.category,
          restaurant.isCompleted ? 1 : 0,
          restaurant.googleMapsUrl,
          restaurant.instagramUrl || null,
          restaurant.coordinates?.lat || null,
          restaurant.coordinates?.lng || null
        );
      }
    });
    
    transaction(restaurants);
  }
  
  // Get all restaurants
  getAllRestaurants(): Restaurant[] {
    const stmt = this.db.prepare(`
      SELECT * FROM restaurants ORDER BY category, name
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(this.mapRowToRestaurant);
  }
  
  // Get restaurants by category
  getRestaurantsByCategory(category: string): Restaurant[] {
    const stmt = this.db.prepare(`
      SELECT * FROM restaurants WHERE category = ? ORDER BY name
    `);
    
    const rows = stmt.all(category) as any[];
    return rows.map(this.mapRowToRestaurant);
  }
  
  // Get restaurants by completion status
  getRestaurantsByStatus(isCompleted: boolean): Restaurant[] {
    const stmt = this.db.prepare(`
      SELECT * FROM restaurants WHERE is_completed = ? ORDER BY category, name
    `);
    
    const rows = stmt.all(isCompleted ? 1 : 0) as any[];
    return rows.map(this.mapRowToRestaurant);
  }
  
  // Search restaurants by name or description
  searchRestaurants(query: string): Restaurant[] {
    const stmt = this.db.prepare(`
      SELECT * FROM restaurants 
      WHERE name LIKE ? OR description LIKE ? 
      ORDER BY name
    `);
    
    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern) as any[];
    return rows.map(this.mapRowToRestaurant);
  }
  
  // Update restaurant completion status
  updateRestaurantStatus(id: string, isCompleted: boolean): void {
    const stmt = this.db.prepare(`
      UPDATE restaurants 
      SET is_completed = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(isCompleted ? 1 : 0, id);
  }
  
  // Update restaurant coordinates
  updateRestaurantCoordinates(id: string, lat: number, lng: number): void {
    const stmt = this.db.prepare(`
      UPDATE restaurants 
      SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(lat, lng, id);
  }
  
  // Get all categories
  getAllCategories(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT category FROM restaurants 
      WHERE category IS NOT NULL 
      ORDER BY category
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => row.category);
  }
  
  // Get restaurant statistics
  getStats(): { total: number; completed: number; categories: number } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM restaurants');
    const completedStmt = this.db.prepare('SELECT COUNT(*) as count FROM restaurants WHERE is_completed = 1');
    const categoriesStmt = this.db.prepare('SELECT COUNT(DISTINCT category) as count FROM restaurants WHERE category IS NOT NULL');
    
    const total = (totalStmt.get() as any)?.count || 0;
    const completed = (completedStmt.get() as any)?.count || 0;
    const categories = (categoriesStmt.get() as any)?.count || 0;
    
    return { total, completed, categories };
  }
  
  private mapRowToRestaurant(row: any): Restaurant {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      isCompleted: Boolean(row.is_completed),
      googleMapsUrl: row.google_maps_url,
      instagramUrl: row.instagram_url,
      coordinates: row.latitude && row.longitude ? {
        lat: row.latitude,
        lng: row.longitude
      } : undefined
    };
  }
}

export default RestaurantRepository;
