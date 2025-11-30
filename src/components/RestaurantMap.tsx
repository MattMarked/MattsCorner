'use client';

import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinatesLoaded, setCoordinatesLoaded] = useState(0);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fetch coordinates for restaurants that don't have them
  const fetchCoordinates = useCallback(async () => {
    if (!restaurants.length) return;
    
    setIsLoading(true);
    setError(null);
    setCoordinatesLoaded(0);

    try {
      const restaurantsWithCoordinates: RestaurantWithCoords[] = [];
      
      for (let i = 0; i < restaurants.length; i++) {
        const restaurant = restaurants[i];
        
        if (restaurant.coordinates) {
          // Restaurant already has coordinates
          restaurantsWithCoordinates.push({
            ...restaurant,
            coordinates: restaurant.coordinates
          });
          setCoordinatesLoaded(i + 1);
        } else {
          // Fetch coordinates from Google Maps URL
          try {
            const coords = await extractCoordinatesFromMapsUrl(restaurant.googleMapsUrl);
            
            if (coords) {
              restaurantsWithCoordinates.push({
                ...restaurant,
                coordinates: coords
              });
            } else {
              // Fallback to Dublin center if geocoding fails
              console.warn(`Could not geocode restaurant: ${restaurant.name}`);
              restaurantsWithCoordinates.push({
                ...restaurant,
                coordinates: DUBLIN_CENTER
              });
            }
            setCoordinatesLoaded(i + 1);
          } catch (err) {
            console.error(`Error geocoding restaurant ${restaurant.name}:`, err);
            // Add with fallback coordinates
            restaurantsWithCoordinates.push({
              ...restaurant,
              coordinates: DUBLIN_CENTER
            });
            setCoordinatesLoaded(i + 1);
          }
        }
        
        // Small delay to avoid hitting API rate limits
        if (i < restaurants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setRestaurantsWithCoords(restaurantsWithCoordinates);
    } catch (err) {
      console.error('Error fetching coordinates:', err);
      setError('Failed to load restaurant locations');
    } finally {
      setIsLoading(false);
    }
  }, [restaurants]);

  useEffect(() => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  const handleMarkerClick = (restaurant: RestaurantWithCoords) => {
    setSelectedRestaurant(restaurant);
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
          <Map
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

            {selectedRestaurant && (
              <InfoWindow
                position={selectedRestaurant.coordinates}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                <div className="p-2 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-lg ${selectedRestaurant.isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedRestaurant.isCompleted ? '✅' : '📍'}
                    </span>
                    <h3 className="font-semibold text-gray-900">{selectedRestaurant.name}</h3>
                  </div>
                  
                  {selectedRestaurant.category && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                      {selectedRestaurant.category}
                    </span>
                  )}
                  
                  {selectedRestaurant.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedRestaurant.description}</p>
                  )}
                  
                  <div className="flex gap-2 text-xs">
                    <a
                      href={selectedRestaurant.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      📍 View on Maps
                    </a>
                    {selectedRestaurant.instagramUrl && (
                      <a
                        href={selectedRestaurant.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 underline"
                      >
                        📷 Instagram
                      </a>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
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
