import crypto from 'crypto';
import { resolveGoogleMapsUrl, batchResolveUrls, type Coordinates, extractCoordinatesFromUrl as extractCoordinatesFromMapsUrl } from './url-resolver';

// Dublin city center coordinates
export const DUBLIN_CENTER = {
  lat: 53.3498,
  lng: -6.2603
};

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  isCompleted: boolean;
  googleMapsUrl: string;
  instagramUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function parseMarkdownToRestaurants(markdownContent: string, resolveCoordinates: boolean = true): Promise<Restaurant[]> {
  const restaurants: Restaurant[] = [];
  const lines = markdownContent.split('\n');
  
  let currentCategory = '';
  let isInCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Track code blocks to ignore their content
    if (trimmedLine.startsWith('```')) {
      isInCodeBlock = !isInCodeBlock;
      continue;
    }
    
    if (isInCodeBlock) continue;
    
    // Detect restaurants: starts with - [] or - [x]
    // Can be indented or not
    const restaurantMatch = rawLine.match(/^(\s*)- \[( |x)\] (.*)/i);
    if (restaurantMatch) {
      const indentation = restaurantMatch[1];
      const isCompleted = restaurantMatch[2].toLowerCase() === 'x';
      const content = restaurantMatch[3];
      
      // If not indented, it has no category parent
      const category = indentation.length > 0 ? currentCategory : '';
      
      const restaurant = parseRestaurantItem(content, category, isCompleted);
      if (restaurant) {
        restaurants.push(restaurant);
      }
      continue;
    }
    
    // Detect categories: starts with - followed by uppercase letter
    const categoryMatch = trimmedLine.match(/^- ([A-Z].*)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }
  }
  
  console.log(`Total restaurants parsed: ${restaurants.length}`);
  
  // Resolve coordinates for all restaurants if requested
  if (resolveCoordinates && restaurants.length > 0) {
    console.log('Resolving coordinates for Google Maps URLs...');
    await resolveRestaurantCoordinates(restaurants);
  }
  
  return restaurants;
}

function parseRestaurantItem(content: string, category: string, isCompleted: boolean): Restaurant | null {
  try {
    let nameAndDescriptionPart = content;
    let linksPart = '';

    // Split by pipe | for links
    if (content.includes('|')) {
      const parts = content.split('|');
      nameAndDescriptionPart = parts[0].trim();
      linksPart = parts[1].trim();
    }

    // Split name and description by -
    let name = '';
    let description = '';

    if (nameAndDescriptionPart.includes(' - ')) {
      const parts = nameAndDescriptionPart.split(' - ');
      description = parts[0].trim();
      name = parts[1].trim();
    } else {
      name = nameAndDescriptionPart.trim();
      description = nameAndDescriptionPart.trim();
    }

    // Parse links
    let googleMapsUrl = '';
    let instagramUrl = '';

    if (linksPart) {
      // remove any trailing and leading parentheses or brackets ()[]
      const cleanLinks = linksPart.replace(/[()\[\]]/g, ' ').split(/\s+/).filter(Boolean);
      for (const link of cleanLinks) {
        if (link.startsWith('http')) {
          if (link.includes('google.com/maps') || link.includes('maps.google.com') || link.includes('goo.gl/maps') || link.includes('maps.app.goo.gl')) {
            googleMapsUrl = link;
          } else {
            // social network / website link
            instagramUrl = link;
          }
        }
      }
    }

    // Skip items without Google Maps URL (required)
    if (!googleMapsUrl) {
      console.warn(`Skipping restaurant without Google Maps URL: ${name}`);
      return null;
    }

    // Generate unique ID based on name and category
    const id = crypto
      .createHash('md5')
      .update(`${category}-${name}`)
      .digest('hex')
      .substring(0, 8);
    
    const restaurant: Restaurant = {
      id,
      name: name || 'Unknown Restaurant',
      description: description,
      category: category || 'Uncategorized',
      isCompleted,
      googleMapsUrl,
      instagramUrl: instagramUrl || undefined
    };
    
    return restaurant;
    
  } catch (error) {
    console.error(`Error parsing restaurant item "${content}":`, error);
    return null;
  }
}

/**
 * Resolves coordinates for restaurants that don't have them
 */
async function resolveRestaurantCoordinates(restaurants: Restaurant[]): Promise<void> {
  // Find restaurants that need coordinate resolution
  const restaurantsNeedingCoords = restaurants.filter(r => !r.coordinates && r.googleMapsUrl);
  
  if (restaurantsNeedingCoords.length === 0) {
    console.log('All restaurants already have coordinates');
    return;
  }
  
  console.log(`Resolving coordinates for ${restaurantsNeedingCoords.length} restaurants...`);
  
  // Extract unique URLs to avoid duplicate work
  const uniqueUrls = Array.from(new Set(restaurantsNeedingCoords.map(r => r.googleMapsUrl)));
  
  // Batch resolve all URLs
  const resolvedCoords = await batchResolveUrls(uniqueUrls);
  
  // Apply resolved coordinates back to restaurants
  let resolvedCount = 0;
  let fallbackCount = 0;
  
  for (const restaurant of restaurantsNeedingCoords) {
    const coords = resolvedCoords.get(restaurant.googleMapsUrl);
    
    if (coords) {
      restaurant.coordinates = coords;
      resolvedCount++;
    } else {
      console.warn(`Could not resolve coordinates for: ${restaurant.name}`);
      fallbackCount++;
    }
  }
  
  console.log(`✅ Resolved ${resolvedCount} coordinates, ${fallbackCount} failures`);
}

// Export for testing
export { parseRestaurantItem, resolveRestaurantCoordinates };