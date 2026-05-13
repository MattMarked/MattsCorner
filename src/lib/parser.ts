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
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Track code blocks to ignore their content
    if (line.startsWith('```')) {
      isInCodeBlock = !isInCodeBlock;
      continue;
    }
    
    if (isInCodeBlock) continue;
    
    // Detect categories (headers like ## Category or # Category)
    const categoryMatch = line.match(/^#+\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      console.log(`Found category: ${currentCategory}`);
      continue;
    }
    
    // Detect list items (lines starting with - or *)
    const listItemMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (listItemMatch) {
      const itemContent = listItemMatch[1];
      const restaurant = parseRestaurantItem(itemContent, currentCategory);
      
      if (restaurant) {
        restaurants.push(restaurant);
        console.log(`Parsed restaurant: ${restaurant.name} in category: ${restaurant.category}`);
      }
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

function parseRestaurantItem(content: string, category: string): Restaurant | null {
  try {
    // Remove content in square brackets [ ]
    let cleanContent = content.replace(/\[[^\]]*\]/g, '').trim();
    
    // Extract links (both in markdown format [text](url) and plain URLs)
    const links: string[] = [];
    
    // Extract markdown links and capture link text for potential use as name
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const extractedLinkTexts: string[] = [];
    let match;
    while ((match = markdownLinkRegex.exec(cleanContent)) !== null) {
      links.push(match[2]);
      if (match[1].trim()) {
        extractedLinkTexts.push(match[1].trim());
      }
    }
    
    // Remove markdown links from content
    cleanContent = cleanContent.replace(markdownLinkRegex, '').trim();
    
    // Extract plain URLs (http/https)
    const urlRegex = /(https?:\/\/[^\s)+]+)/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(cleanContent)) !== null) {
      links.push(urlMatch[1]);
    }
    
    // Remove plain URLs from content
    cleanContent = cleanContent.replace(urlRegex, '').trim();
    
    // Remove parentheses that might be left from links
    cleanContent = cleanContent.replace(/\(\s*\)/g, '').trim();
    
    // Split by " - " to separate description and name
    const parts = cleanContent.split(' - ').map(part => part.trim()).filter(part => part);
    
    let description = '';
    let nameWithNote = '';
    
    if (parts.length === 2) {
      // First part is description, second is name
      description = parts[0];
      nameWithNote = parts[1];
    } else if (parts.length === 1) {
      // Only one part, it's the name
      nameWithNote = parts[0];
    } else if (parts.length === 0) {
      // No plain text, try to use first link text as name
      if (extractedLinkTexts.length > 0) {
        nameWithNote = extractedLinkTexts[0];
        description = '';
      } else {
        console.warn(`Skipping invalid restaurant item: ${content}`);
        return null;
      }
    } else {
      // Invalid format, skip
      console.warn(`Skipping invalid restaurant item: ${content}`);
      return null;
    }
    
    // Parse name and note (separated by comma)
    const nameMatch = nameWithNote.match(/^([^,]+)(?:,\s*(.+))?/);
    const name = nameMatch ? nameMatch[1].trim() : nameWithNote;
    const note = nameMatch && nameMatch[2] ? nameMatch[2].trim() : '';
    
    // Combine description and note
    let finalDescription = description;
    if (note) {
      finalDescription = finalDescription ? `${finalDescription} (${note})` : note;
    }
    
    // Categorize links
    let googleMapsUrl = '';
    let instagramUrl = '';
    
    for (const link of links) {
      if (link.includes('google.com/maps') || link.includes('maps.google.com') || link.includes('goo.gl/maps') || link.includes('maps.app.goo.gl')) {
        googleMapsUrl = link;
      } else if (link.includes('instagram.com')) {
        instagramUrl = link;
      }
      // Add other link types as needed
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
    
    // Determine completion status based on various indicators
    const completionIndicators = [
      '✅', '✓', '[x]', '[X]', '☑', '🗸',
      'visited', 'done', 'completed', 'been',
      'went', 'tried', 'ate'
    ];
    
    const isCompleted = completionIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    const restaurant: Restaurant = {
      id,
      name: name || 'Unknown Restaurant',
      description: finalDescription,
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
  
  console.log(`✅ Resolved ${resolvedCount} coordinates, ${fallbackCount} fallbacks to Dublin center`);
}

// Helper function to clean text content
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except common punctuation
    .trim();
}

// Export for testing
export { parseRestaurantItem, resolveRestaurantCoordinates };