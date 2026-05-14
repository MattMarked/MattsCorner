'use client';

import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Restaurant, DUBLIN_CENTER } from '@/lib/parser';

// Dynamically import the Leaflet map component to avoid SSR issues
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 animate-pulse">
      <div className="text-gray-400">Loading Map...</div>
    </div>
  )
});

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
      }
    }
    
    setRestaurantsWithCoords(restaurantsWithCoordinates);
    setIsLoadingCoords(false);
  }, [restaurants]);

  // Process restaurants when they change
  useEffect(() => {
    if (restaurants.length > 0) {
      processRestaurants();
    } else {
      setRestaurantsWithCoords([]);
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

    // Calculate center from bounds
    const bounds = {
      minLat: Math.min(...restaurantsWithCoords.map(r => r.coordinates.lat)),
      maxLat: Math.max(...restaurantsWithCoords.map(r => r.coordinates.lat)),
      minLng: Math.min(...restaurantsWithCoords.map(r => r.coordinates.lng)),
      maxLng: Math.max(...restaurantsWithCoords.map(r => r.coordinates.lng)),
    };

    const center = {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };

    return { center, zoom: 12 };
  }, [restaurantsWithCoords]);

  return (
    <div className="h-[calc(100vh-80px)] w-full overflow-hidden border">
      {isLoadingCoords && (
        <div className="absolute top-0 left-0 right-0 z-[2000] bg-blue-50/80 backdrop-blur-sm p-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-xs text-blue-700">Loading locations...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-0 left-0 right-0 z-[2000] bg-red-50/80 backdrop-blur-sm p-1 text-center">
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      <MapInner 
        restaurants={restaurantsWithCoords} 
        center={mapSettings.center} 
        zoom={mapSettings.zoom}
        onRestaurantClick={onRestaurantClick}
      />
    </div>
  );
}
