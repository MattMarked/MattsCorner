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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;

    // Check if this line contains a Google Maps URL - if yes, it's an item
    if (trimmedLine.includes('https://maps.app.goo.gl/')) {
      const restaurant = parseRestaurantLine(trimmedLine, currentCategory);
      if (restaurant) {
        restaurants.push(restaurant);
      }
    } else {
      // If no Google Maps URL, it's a category line
      // Remove any leading dashes, brackets, and whitespace to get clean category name
      let categoryName = trimmedLine
        .replace(/^[\s\-\*]*/, '') // Remove leading whitespace, dashes, asterisks
        .replace(/^\[[x ]\]\s*/, '') // Remove checkbox if present
        .trim();
      
      // Only set as category if it's not empty after cleaning
      if (categoryName) {
        currentCategory = categoryName;
      }
    }
  }

  return restaurants;
}

function parseRestaurantLine(line: string, category: string | null): Restaurant | null {
  try {
    // Extract completion status
    const isCompleted = line.includes('[x]');
    
    // Extract Google Maps URL as primary key
    const mapsUrlMatch = line.match(/https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+/);
    if (!mapsUrlMatch) return null;
    
    const googleMapsUrl = mapsUrlMatch[0];
    // Remove leading and trailing parentheses from URL when using as database key
    const id = googleMapsUrl.replace(/^\(+|\)+$/g, '');
    
    // Extract Instagram URL if present
    const instagramUrlMatch = line.match(/https:\/\/www\.instagram\.com\/[^)]+/);
    const instagramUrl = instagramUrlMatch ? instagramUrlMatch[0] : undefined;
    
    // Process brackets according to new rules:
    // 1. Remove double brackets [[]] and their content completely
    // 2. Convert single brackets [] to just the content
    let processedLine = line
      .replace(/\[\[[^\]]*\]\]/g, '') // Remove [[content]] completely
      .replace(/\[([^\]]*)\]/g, '$1') // Convert [content] to just content
      .replace(/https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+\)?/g, '') // Remove Google Maps URL
      .replace(/\(https:\/\/www\.instagram\.com\/[^)]+\)/g, '') // Remove Instagram URLs
      .replace(/^\s*-\s*/, '') // Remove leading dash and whitespace
      .trim();

    // Split by "-" separator to get name, description, notes
    const parts = processedLine.split(' - ').map(part => part.trim()).filter(part => part.length > 0);
    
    // Map parts: splitted[0] = name, splitted[1] = description, splitted[2]+ = notes
    const name = parts[0] || '';
    const description = parts[1] || '';
    const notes = parts.length > 2 ? parts.slice(2).join(' - ') : '';
    
    // Combine description and notes if both exist
    const fullDescription = notes ? `${description} - ${notes}` : description;
    
    return {
      id,
      name,
      description: fullDescription,
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
