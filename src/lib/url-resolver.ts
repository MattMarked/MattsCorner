import { applyConfiguredShift } from './coordinates';

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Resolves a shortened Google Maps URL to get coordinates
 * Works by following redirects to get the full URL, then extracting coordinates
 */
export async function resolveGoogleMapsUrl(shortenedUrl: string): Promise<Coordinates | null> {
  if (!shortenedUrl) return null;
  
  try {
    // If the URL already contains coordinates, extract them directly
    let coords = extractCoordinatesFromUrl(shortenedUrl);
    
    if (!coords) {
      // Follow redirects to get the full URL
      const fullUrl = await followRedirects(shortenedUrl);
      if (fullUrl) {
        coords = extractCoordinatesFromUrl(fullUrl);
      }
    }
    
    // Apply coordinate shift if enabled
    return applyConfiguredShift(coords);
    
  } catch (error) {
    console.error(`Error resolving URL ${shortenedUrl}:`, error);
    return null;
  }
}

/**
 * Follows HTTP redirects to get the final URL
 */
async function followRedirects(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'GET', // GET is more reliable for some redirects than HEAD
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return response.url || null;
  } catch (error) {
    console.error(`Error following redirects for ${url}:`, error);
    return null;
  }
}

/**
 * Extracts coordinates from various Google Maps URL patterns
 */
export function extractCoordinatesFromUrl(url: string): Coordinates | null {
  if (!url) return null;
  
  try {
    // Pattern 1: @lat,lng,zoom (most common in full URLs)
    let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Pattern 2: !3d and !4d parameters (alternative format)
    const latMatch = url.match(/!3d(-?\d+\.\d+)/);
    const lngMatch = url.match(/!4d(-?\d+\.\d+)/);
    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1])
      };
    }
    
    // Pattern 3: ll=lat,lng
    match = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Pattern 4: q=lat,lng
    match = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Pattern 5: destination=lat,lng
    match = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
  } catch (error) {
    console.error('Error extracting coordinates:', error);
  }
  
  return null;
}

/**
 * Batch resolve multiple URLs with rate limiting to be respectful
 */
export async function batchResolveUrls(urls: string[]): Promise<Map<string, Coordinates | null>> {
  const results = new Map<string, Coordinates | null>();
  
  // Process in batches of 10 with 100ms delay between requests
  const batchSize = 10;
  const delayMs = 100;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    const promises = batch.map(async (url) => {
      const coords = await resolveGoogleMapsUrl(url);
      results.set(url, coords);
      return coords;
    });
    
    await Promise.all(promises);
    
    // Add delay between batches (except for the last batch)
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
