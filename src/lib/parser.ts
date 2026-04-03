import crypto from 'crypto';

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

export function parseMarkdownToRestaurants(markdownContent: string): Restaurant[] {
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
  return restaurants;
}

function parseRestaurantItem(content: string, category: string): Restaurant | null {
  try {
    // Remove content in square brackets [ ]
    let cleanContent = content.replace(/\[[^\]]*\]/g, '').trim();
    
    // Extract links (both in markdown format [text](url) and plain URLs)
    const links: string[] = [];
    
    // Extract markdown links
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownLinkRegex.exec(cleanContent)) !== null) {
      links.push(match[2]);
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
      if (link.includes('google.com/maps') || link.includes('maps.google.com') || link.includes('goo.gl/maps')) {
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

// Helper function to clean text content
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except common punctuation
    .trim();
}

// Helper function to extract coordinates from Google Maps URLs
export function extractCoordinatesFromMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  
  try {
    // Try different Google Maps URL patterns
    
    // Pattern 1: @lat,lng,zoom
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
    
    // Pattern 4: destination coordinates
    match = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
  }
  
  return null;
}

// Export for testing
export { parseRestaurantItem };
