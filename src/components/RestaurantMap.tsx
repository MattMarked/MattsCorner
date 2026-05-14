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

  // Default settings
  const mapSettings = {
    center: DUBLIN_CENTER,
    zoom: 12
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {isLoadingCoords && (
        <div className="absolute top-0 left-0 right-0 z-[2000] bg-blue-50/80 backdrop-blur-sm p-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-[10px] text-blue-700 font-medium">Loading locations...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-0 left-0 right-0 z-[2000] bg-red-50/80 backdrop-blur-sm p-1 text-center">
          <span className="text-[10px] text-red-700 font-medium">{error}</span>
        </div>
      )}

      <MapInner 
        restaurants={restaurantsWithCoords} 
        center={mapSettings.center} 
        zoom={18}
        onRestaurantClick={onRestaurantClick}
      />
    </div>
  );
}
