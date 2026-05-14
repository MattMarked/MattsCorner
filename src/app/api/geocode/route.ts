import { NextRequest, NextResponse } from 'next/server';
import { applyConfiguredShift } from '@/lib/coordinates';
import { resolveGoogleMapsUrl } from '@/lib/url-resolver';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log(`[API] GET /api/geocode triggered`);
  const { searchParams } = new URL(request.url);
  const mapsUrl = searchParams.get('url');

  if (!mapsUrl) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Resolve coordinates from the URL using our zero-cost resolver
    const coords = await resolveGoogleMapsUrl(mapsUrl);
    
    if (coords) {
      const shiftedCoords = applyConfiguredShift(coords);
      return NextResponse.json({
        coordinates: shiftedCoords
      });
    }

    // If nothing works, return null coordinates
    return NextResponse.json({ coordinates: null });

  } catch (error) {
    console.error('Error geocoding URL:', error);
    return NextResponse.json({ error: 'Failed to geocode URL' }, { status: 500 });
  }
}
