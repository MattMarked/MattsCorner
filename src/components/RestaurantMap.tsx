'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { APIProvider, Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';
import { Restaurant, extractCoordinatesFromMapsUrl, DUBLIN_CENTER } from '@/lib/parser';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

interface RestaurantWithCoords extends Restaurant {
  coordinates: { lat: number; lng: number };
}

export default function RestaurantMap({ restaurants, onRestaurantClick }: RestaurantMapProps) {
  const [restaurantsWithCoords, setRestaurantsWithCoords] = useState<RestaurantWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinatesLoaded, setCoordinatesLoaded] = useState(0);

  // Cache for geocoded coordinates to prevent duplicate API calls
  const coordinatesCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const isGeocodingRef = useRef(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Memoize restaurants to prevent unnecessary re-renders
  const memoizedRestaurants = useMemo(() => {
    return restaurants.map(r => ({ ...r }));
  }, [restaurants.length]);

  // Fetch coordinates for restaurants that don't have them
  const fetchCoordinates = useCallback(async () => {
    if (!memoizedRestaurants.length || isGeocodingRef.current) return;
    
    isGeocodingRef.current = true;
    setIsLoading(true);
    setError(null);
    setCoordinatesLoaded(0);

    try {
      const restaurantsWithCoordinates: RestaurantWithCoords[] = [];
      
      for (let i = 0; i < memoizedRestaurants.length; i++) {
        const restaurant = memoizedRestaurants[i];
        
        if (restaurant.coordinates) {
          // Restaurant already has coordinates
          restaurantsWithCoordinates.push({
            ...restaurant,
            coordinates: restaurant.coordinates
          });
          setCoordinatesLoaded(i + 1);
        } else {
          // Check cache first
          const cachedCoords = coordinatesCache.current.get(restaurant.googleMapsUrl);
          if (cachedCoords) {
            restaurantsWithCoordinates.push({
              ...restaurant,
              coordinates: cachedCoords
            });
            setCoordinatesLoaded(i + 1);
          } else {
            // Fetch coordinates from Google Maps URL
            try {
              const coords = await extractCoordinatesFromMapsUrl(restaurant.googleMapsUrl);
              
              if (coords) {
                // Cache the result
                coordinatesCache.current.set(restaurant.googleMapsUrl, coords);
                restaurantsWithCoordinates.push({
                  ...restaurant,
                  coordinates: coords
                });
              } else {
                // Fallback to Dublin center if geocoding fails
                console.warn(`Could not geocode restaurant: ${restaurant.name}`);
                const fallbackCoords = DUBLIN_CENTER;
                coordinatesCache.current.set(restaurant.googleMapsUrl, fallbackCoords);
                restaurantsWithCoordinates.push({
                  ...restaurant,
                  coordinates: fallbackCoords
                });
              }
              setCoordinatesLoaded(i + 1);
            } catch (err) {
              console.error(`Error geocoding restaurant ${restaurant.name}:`, err);
              // Add with fallback coordinates
              const fallbackCoords = DUBLIN_CENTER;
              coordinatesCache.current.set(restaurant.googleMapsUrl, fallbackCoords);
              restaurantsWithCoordinates.push({
                ...restaurant,
                coordinates: fallbackCoords
              });
              setCoordinatesLoaded(i + 1);
            }
          }
        }
        
        // Small delay to avoid hitting API rate limits
        if (i < memoizedRestaurants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setRestaurantsWithCoords(restaurantsWithCoordinates);
    } catch (err) {
      console.error('Error fetching coordinates:', err);
      setError('Failed to load restaurant locations');
    } finally {
      setIsLoading(false);
      isGeocodingRef.current = false;
    }
  }, [memoizedRestaurants]);

  useEffect(() => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  const handleMarkerClick = (restaurant: RestaurantWithCoords) => {
    onRestaurantClick?.(restaurant);
  };

  if (!apiKey) {
    return (
      <div className="w-full h-[600px] lg:h-[70vh] bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🔑</div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">API Key Required</h3>
          <p className="text-red-600">Please configure your Google Maps API key to view the map</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] lg:h-[70vh] bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Map</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchCoordinates}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-700">
              Loading restaurant locations... ({coordinatesLoaded}/{restaurants.length})
            </span>
          </div>
        </div>
      )}
      
      <div className="w-full h-[600px] lg:h-[70vh] rounded-lg overflow-hidden">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultCenter={DUBLIN_CENTER}
            defaultZoom={12}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {restaurantsWithCoords.map((restaurant) => (
              <Marker
                key={restaurant.id}
                position={restaurant.coordinates}
                onClick={() => handleMarkerClick(restaurant)}
                title={restaurant.name}
              />
            ))}
          </GoogleMap>
        </APIProvider>
      </div>

      {/* Restaurant Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <strong>{restaurantsWithCoords.length}</strong> restaurants on map
          </div>
          <div>
            <span className="text-green-600">
              {restaurantsWithCoords.filter(r => r.isCompleted).length} visited
            </span>
            {' • '}
            <span className="text-gray-500">
              {restaurantsWithCoords.filter(r => !r.isCompleted).length} to try
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
