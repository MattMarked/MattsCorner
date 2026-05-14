import { createClient, Client } from '@libsql/client';
import { Restaurant } from './parser';
import { shiftCoordinatesEast, isCoordinateShiftEnabled, getEastShiftDistance } from './coordinates';

let client: Client | null = null;

export function getDatabase(): Client {
  if (!client) {
    console.log('[DB] Initializing database client...');
    // For local development, use local SQLite file
    // For production (Vercel), use Turso cloud database
    if (process.env.TURSO_DATABASE_URL) {
      console.log('[DB] Using Turso cloud database');
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      console.log('[DB] Using local SQLite database');
      // Local development fallback
      client = createClient({
        url: 'file:database/restaurants.db'
      });
    }
    
    // Initialize tables on startup
    console.log('[DB] Triggering table initialization...');
    initializeTables().then(() => {
      console.log('[DB] Table initialization finished');
    }).catch(err => {
      console.error('[DB] Table initialization failed:', err);
    });
  }
  
  return client;
}

async function initializeTables() {
  if (!client) return;
  
  try {
    // Create restaurants table
    await client.execute(`
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
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_completed ON restaurants(is_completed)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants(latitude, longitude)`);
    
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

export class RestaurantRepository {
  private client: Client;
  
  constructor() {
    this.client = getDatabase();
  }
  
  // Insert or update restaurants
  async upsertRestaurant(restaurant: Restaurant): Promise<void> {
    try {
      await this.client.execute({
        sql: `
          INSERT OR REPLACE INTO restaurants (
            id, name, description, category, is_completed, 
            google_maps_url, instagram_url, latitude, longitude, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        args: [
          restaurant.id,
          restaurant.name,
          restaurant.description,
          restaurant.category,
          restaurant.isCompleted ? 1 : 0,
          restaurant.googleMapsUrl,
          restaurant.instagramUrl || null,
          restaurant.coordinates?.lat || null,
          restaurant.coordinates?.lng || null
        ]
      });
    } catch (error) {
      console.error('Error upserting restaurant:', error);
      throw error;
    }
  }
  
  // Batch insert restaurants using transaction
  async upsertRestaurants(restaurants: Restaurant[]): Promise<void> {
    if (restaurants.length === 0) return;
    
    try {
      const statements = restaurants.map(restaurant => ({
        sql: `
          INSERT OR REPLACE INTO restaurants (
            id, name, description, category, is_completed, 
            google_maps_url, instagram_url, latitude, longitude, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        args: [
          restaurant.id,
          restaurant.name,
          restaurant.description,
          restaurant.category,
          restaurant.isCompleted ? 1 : 0,
          restaurant.googleMapsUrl,
          restaurant.instagramUrl || null,
          restaurant.coordinates?.lat || null,
          restaurant.coordinates?.lng || null
        ]
      }));
      
      await this.client.batch(statements);
    } catch (error) {
      console.error('Error batch upserting restaurants:', error);
      throw error;
    }
  }
  
  // Get all restaurants with pagination
  async getAllRestaurants(limit: number = 100, offset: number = 0): Promise<Restaurant[]> {
    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM restaurants ORDER BY category, name LIMIT ? OFFSET ?`,
        args: [limit, offset]
      });
      
      return result.rows.map(this.mapRowToRestaurant);
    } catch (error) {
      console.error('Error getting all restaurants:', error);
      return [];
    }
  }
  
  // Get restaurants by category
  async getRestaurantsByCategory(category: string): Promise<Restaurant[]> {
    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM restaurants WHERE category = ? ORDER BY name`,
        args: [category]
      });
      
      return result.rows.map(this.mapRowToRestaurant);
    } catch (error) {
      console.error('Error getting restaurants by category:', error);
      return [];
    }
  }
  
  // Get restaurants by completion status
  async getRestaurantsByStatus(isCompleted: boolean): Promise<Restaurant[]> {
    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM restaurants WHERE is_completed = ? ORDER BY category, name`,
        args: [isCompleted ? 1 : 0]
      });
      
      return result.rows.map(this.mapRowToRestaurant);
    } catch (error) {
      console.error('Error getting restaurants by status:', error);
      return [];
    }
  }
  
  // Search restaurants by name or description
  async searchRestaurants(query: string): Promise<Restaurant[]> {
    try {
      const searchPattern = `%${query}%`;
      const result = await this.client.execute({
        sql: `
          SELECT * FROM restaurants 
          WHERE name LIKE ? OR description LIKE ? 
          ORDER BY 
            CASE 
              WHEN name LIKE ? THEN 1 
              ELSE 2 
            END, name
        `,
        args: [searchPattern, searchPattern, searchPattern]
      });
      
      return result.rows.map(this.mapRowToRestaurant);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }
  
  // Update restaurant completion status
  async updateRestaurantStatus(id: string, isCompleted: boolean): Promise<void> {
    try {
      await this.client.execute({
        sql: `
          UPDATE restaurants 
          SET is_completed = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `,
        args: [isCompleted ? 1 : 0, id]
      });
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      throw error;
    }
  }
  
  // Update restaurant coordinates
  async updateRestaurantCoordinates(id: string, lat: number, lng: number): Promise<void> {
    try {
      await this.client.execute({
        sql: `
          UPDATE restaurants 
          SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `,
        args: [lat, lng, id]
      });
    } catch (error) {
      console.error('Error updating restaurant coordinates:', error);
      throw error;
    }
  }
  
  // Get all categories (cached for performance)
  async getAllCategories(): Promise<string[]> {
    try {
      const result = await this.client.execute(`
        SELECT DISTINCT category FROM restaurants 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
      `);
      
      return result.rows.map(row => row.category as string);
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  // Get restaurant statistics
  async getStats(): Promise<{ total: number; completed: number; categories: number }> {
    try {
      const [totalResult, completedResult, categoriesResult] = await Promise.all([
        this.client.execute('SELECT COUNT(*) as count FROM restaurants'),
        this.client.execute('SELECT COUNT(*) as count FROM restaurants WHERE is_completed = 1'),
        this.client.execute('SELECT COUNT(DISTINCT category) as count FROM restaurants WHERE category IS NOT NULL AND category != ""')
      ]);
      
      const total = Number(totalResult.rows[0]?.count) || 0;
      const completed = Number(completedResult.rows[0]?.count) || 0;
      const categories = Number(categoriesResult.rows[0]?.count) || 0;
      
      return { total, completed, categories };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { total: 0, completed: 0, categories: 0 };
    }
  }
  
  // Get restaurants within bounding box (for map display)
  async getRestaurantsInBounds(
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number }
  ): Promise<Restaurant[]> {
    try {
      const result = await this.client.execute({
        sql: `
          SELECT * FROM restaurants 
          WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND latitude BETWEEN ? AND ? 
            AND longitude BETWEEN ? AND ?
          ORDER BY category, name
        `,
        args: [
          southWest.lat,
          northEast.lat,
          southWest.lng,
          northEast.lng
        ]
      });
      
      return result.rows.map(this.mapRowToRestaurant);
    } catch (error) {
      console.error('Error getting restaurants in bounds:', error);
      return [];
    }
  }
  
  // Migrate existing coordinates by applying eastward shift
  async migrateCoordinatesEastward(): Promise<{ updated: number; skipped: number }> {
    if (!isCoordinateShiftEnabled()) {
      console.log('Coordinate shifting is disabled, skipping migration');
      return { updated: 0, skipped: 0 };
    }
    
    const shiftDistance = getEastShiftDistance();
    console.log(`Migrating existing coordinates with ${shiftDistance}m eastward shift...`);
    
    try {
      // Get all restaurants with coordinates
      const selectResult = await this.client.execute(`
        SELECT id, name, latitude, longitude 
        FROM restaurants 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `);
      
      let updated = 0;
      let skipped = 0;
      
      // Process in batches for better performance
      const updates = [];
      
      for (const row of selectResult.rows) {
        try {
          const originalCoords = {
            lat: Number(row.latitude),
            lng: Number(row.longitude)
          };
          
          const shiftedCoords = shiftCoordinatesEast(originalCoords, shiftDistance);
          
          updates.push({
            sql: `
              UPDATE restaurants 
              SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `,
            args: [shiftedCoords.lat, shiftedCoords.lng, row.id]
          });
          
          console.log(`Prepared update for ${row.name}: (${originalCoords.lat}, ${originalCoords.lng}) → (${shiftedCoords.lat}, ${shiftedCoords.lng})`);
          updated++;
        } catch (error) {
          console.error(`Error preparing update for ${row.name}:`, error);
          skipped++;
        }
      }
      
      // Execute batch update
      if (updates.length > 0) {
        await this.client.batch(updates);
      }
      
      console.log(`Migration complete: ${updated} restaurants updated, ${skipped} skipped`);
      return { updated, skipped };
      
    } catch (error) {
      console.error('Error during coordinate migration:', error);
      return { updated: 0, skipped: 0 };
    }
  }
  
  private mapRowToRestaurant(row: any): Restaurant {
    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description || ''),
      category: String(row.category),
      isCompleted: Boolean(row.is_completed),
      googleMapsUrl: String(row.google_maps_url),
      instagramUrl: row.instagram_url ? String(row.instagram_url) : undefined,
      coordinates: row.latitude && row.longitude ? {
        lat: Number(row.latitude),
        lng: Number(row.longitude)
      } : undefined
    };
  }
}

export default RestaurantRepository;