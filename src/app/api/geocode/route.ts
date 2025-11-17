import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mapsUrl = searchParams.get('url');

  if (!mapsUrl) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    // First, follow the redirect to get the full URL with place information
    const redirectResponse = await fetch(mapsUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });

    let finalUrl = redirectResponse.url || mapsUrl;
    
    // Try to extract place ID from the URL
    let placeId = null;
    const placeIdMatch = finalUrl.match(/place\/[^\/]+\/data=.*!1m(\d+)!1m(\d+)!1s([^!]+)/);
    if (placeIdMatch) {
      placeId = placeIdMatch[3];
    } else {
      // Alternative pattern for place IDs
      const altPlaceIdMatch = finalUrl.match(/data=.*!1s([^!]+)!/);
      if (altPlaceIdMatch) {
        placeId = altPlaceIdMatch[1];
      }
    }

    // If we have a place ID, use Places API to get coordinates
    if (placeId && placeId.startsWith('0x')) {
      // Convert hex place ID to coordinates using geocoding
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${apiKey}`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        return NextResponse.json({
          coordinates: {
            lat: location.lat,
            lng: location.lng
          }
        });
      }
    }

    // Fallback: Try to extract coordinates directly from URL
    const coordsMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      return NextResponse.json({
        coordinates: {
          lat: parseFloat(coordsMatch[1]),
          lng: parseFloat(coordsMatch[2])
        }
      });
    }

    // If all else fails, try to extract place name and geocode it
    const placeNameMatch = finalUrl.match(/\/place\/([^\/]+)/);
    if (placeNameMatch) {
      const placeName = decodeURIComponent(placeNameMatch[1]).replace(/\+/g, ' ');
      
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName + ', Dublin, Ireland')}&key=${apiKey}`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        return NextResponse.json({
          coordinates: {
            lat: location.lat,
            lng: location.lng
          }
        });
      }
    }

    // If nothing works, return null coordinates
    return NextResponse.json({ coordinates: null });

  } catch (error) {
    console.error('Error geocoding URL:', error);
    return NextResponse.json({ error: 'Failed to geocode URL' }, { status: 500 });
  }
}
