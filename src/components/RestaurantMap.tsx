import React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { APIProvider, Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';
import { Restaurant, DUBLIN_CENTER } from '@/lib/parser';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

interface RestaurantWithCoords extends Restaurant {
  coordinates: { lat: number; lng: number };
}

export default function RestaurantMap({ restaurants, onRestaurantClick }: RestaurantMapProps) {
  const [restaurantsWithCoords, setRestaurantsWithCoords] = useState<RestaurantWithCoords[]>([]);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinatesLoaded, setCoordinatesLoaded] = useState(0);

  // Process restaurants to ensure they have coordinates
  const processRestaurants = useCallback(() => {
    setIsLoadingCoords(true);
    setError(null);
    
    const restaurantsWithCoordinates: RestaurantWithCoords[] = [];
    
    for (const restaurant of restaurants) {
      if (restaurant.coordinates) {
        // Restaurant has coordinates from database
        restaurantsWithCoordinates.push({
          ...restaurant,
          coordinates: restaurant.coordinates
        });
      } else {
        // Fallback to Dublin center if no coordinates
        console.warn(`Restaurant ${restaurant.name} has no coordinates, using Dublin center`);
        restaurantsWithCoordinates.push({
          ...restaurant,
          coordinates: DUBLIN_CENTER
        });
      }
    }
    
    setRestaurantsWithCoords(restaurantsWithCoordinates);
    setCoordinatesLoaded(restaurantsWithCoordinates.length);
    setIsLoadingCoords(false);
  }, [restaurants]);

  // Process restaurants when they change
  useEffect(() => {
    if (restaurants.length > 0) {
      processRestaurants();
    } else {
      setRestaurantsWithCoords([]);
      setCoordinatesLoaded(0);
    }
  }, [restaurants, processRestaurants]);

  // Calculate map center and bounds
  const mapSettings = useMemo(() => {
    if (restaurantsWithCoords.length === 0) {
      return {
        center: DUBLIN_CENTER,
        zoom: 12
      };
    }

    // Calculate bounds to fit all markers
    const bounds = restaurantsWithCoords.reduce(
      (acc, restaurant) => ({
        minLat: Math.min(acc.minLat, restaurant.coordinates.lat),
        maxLat: Math.max(acc.maxLat, restaurant.coordinates.lat),
        minLng: Math.min(acc.minLng, restaurant.coordinates.lng),
        maxLng: Math.max(acc.maxLng, restaurant.coordinates.lng),
      }),
      {
        minLat: restaurantsWithCoords[0].coordinates.lat,
        maxLat: restaurantsWithCoords[0].coordinates.lat,
        minLng: restaurantsWithCoords[0].coordinates.lng,
        maxLng: restaurantsWithCoords[0].coordinates.lng,
      }
    );

    // Calculate center from bounds
    const center = {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };

    // Calculate appropriate zoom level based on bounds
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 12;
    if (maxDiff > 0.1) zoom = 10;
    if (maxDiff > 0.2) zoom = 9;
    if (maxDiff > 0.5) zoom = 8;
    if (maxDiff < 0.05) zoom = 13;
    if (maxDiff < 0.01) zoom = 14;

    return { center, zoom };
  }, [restaurantsWithCoords]);

  const handleMarkerClick = (restaurant: RestaurantWithCoords) => {
    onRestaurantClick?.(restaurant);
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Google Maps API key not found</p>
          <p className="text-gray-600 text-sm mt-1">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      {isLoadingCoords && restaurants.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">
              Loading restaurant locations... ({coordinatesLoaded}/{restaurants.length})
            </span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-2 text-center">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <GoogleMap
          center={mapSettings.center}
          zoom={mapSettings.zoom}
          style={{ width: '100%', height: isLoadingCoords || error ? 'calc(100% - 40px)' : '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          scaleControl={true}
          streetViewControl={false}
          rotateControl={false}
          fullscreenControl={false}
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
  );
}