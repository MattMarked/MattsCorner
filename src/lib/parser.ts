export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string | null;
  isCompleted: boolean;
  googleMapsUrl: string;
  instagramUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function parseMarkdownToRestaurants(markdownContent: string): Restaurant[] {
  const lines = markdownContent.split('\n');
  const restaurants: Restaurant[] = [];
  let currentCategory: string | null = null;
  let restaurantId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;

    // Check if this is a category line (starts with "- [ ]" and no Google Maps URL)
    if (trimmedLine.startsWith('- [ ]') && !trimmedLine.includes('https://maps.app.goo.gl/')) {
      // This is a category header
      currentCategory = trimmedLine.replace('- [ ]', '').trim();
      continue;
    }

    // Check if this is a restaurant entry (has checkbox and maps link)
    if (trimmedLine.includes('- [') && trimmedLine.includes('https://maps.app.goo.gl/')) {
      const restaurant = parseRestaurantLine(trimmedLine, currentCategory, restaurantId.toString());
      if (restaurant) {
        restaurants.push(restaurant);
        restaurantId++;
      }
    }
  }

  return restaurants;
}

function parseRestaurantLine(line: string, category: string | null, id: string): Restaurant | null {
  try {
    // Extract completion status
    const isCompleted = line.includes('- [x]');
    
    // Extract Google Maps URL
    const mapsUrlMatch = line.match(/https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+/);
    if (!mapsUrlMatch) return null;
    
    const googleMapsUrl = mapsUrlMatch[0];
    
    // Extract Instagram URL if present
    const instagramUrlMatch = line.match(/https:\/\/www\.instagram\.com\/[^)]+/);
    const instagramUrl = instagramUrlMatch ? instagramUrlMatch[0] : undefined;
    
    // Extract name and description
    // Remove checkbox, maps URL, instagram URL, and other markdown links
    let nameAndDescription = line
      .replace(/- \[[x ]\]/, '') // Remove checkbox
      .replace(/https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+\)?/, '') // Remove maps URL
      .replace(/\(https:\/\/www\.instagram\.com\/[^)]+\)/, '') // Remove instagram URL
      .replace(/\[\[[^\]]+\]\]/g, '') // Remove internal links like [[ristoranti vicini a casa]]
      .replace(/\([^)]*\)/g, '') // Remove other parentheses content
      .trim();
    
    // Split name from description (usually separated by ' - ')
    const parts = nameAndDescription.split(' - ');
    const name = parts[0].trim();
    const description = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
    
    return {
      id,
      name,
      description,
      category,
      isCompleted,
      googleMapsUrl,
      instagramUrl,
    };
  } catch (error) {
    console.error('Error parsing restaurant line:', line, error);
    return null;
  }
}

// Extract coordinates from Google Maps URL using the Geocoding API
export async function extractCoordinatesFromMapsUrl(url: string): Promise<{lat: number, lng: number} | null> {
  try {
    // For shortened Google Maps URLs, we need to follow the redirect to get the full URL with coordinates
    const response = await fetch(`/api/geocode?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      console.error('Failed to fetch coordinates for URL:', url);
      return null;
    }
    
    const data = await response.json();
    return data.coordinates || null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', url, error);
    return null;
  }
}

// Default coordinates for Dublin city center as fallback
export const DUBLIN_CENTER = {
  lat: 53.3498,
  lng: -6.2603
};
