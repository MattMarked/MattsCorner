// Server-side URL resolver to get coordinates from shortened Google Maps URLs

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Resolves a shortened Google Maps URL to get coordinates
 * Works by following redirects to get the full URL, then extracting @lat,lng
 */
export async function resolveGoogleMapsUrl(shortenedUrl: string): Promise<Coordinates | null> {
  if (!shortenedUrl) return null;
  
  try {
    // If the URL already contains coordinates, extract them directly
    const directCoords = extractCoordinatesFromUrl(shortenedUrl);
    if (directCoords) {
      return directCoords;
    }
    
    // Follow redirects to get the full URL
    const fullUrl = await followRedirects(shortenedUrl);
    if (!fullUrl) return null;
    
    // Extract coordinates from the full URL
    return extractCoordinatesFromUrl(fullUrl);
    
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
      method: 'HEAD',
      redirect: 'follow'
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
function extractCoordinatesFromUrl(url: string): Coordinates | null {
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
    
    // Pattern 2: ll=lat,lng
    match = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Pattern 3: q=lat,lng
    match = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Pattern 4: destination=lat,lng
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