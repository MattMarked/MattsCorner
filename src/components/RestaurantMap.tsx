'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/parser';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

export default function RestaurantMap({ restaurants, onRestaurantClick }: RestaurantMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // For now, we'll create a simple list view as a placeholder until we get Google Maps API
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg">
      {/* Map Placeholder */}
      <div className="w-full h-96 bg-gradient-to-br from-blue-200 to-green-200 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map Coming Soon</h3>
          <p className="text-gray-600 mb-4">Configure Google Maps API key to see restaurants on map</p>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 max-w-sm">
            <p className="text-sm text-gray-700">
              <strong>{restaurants.length}</strong> restaurants loaded
            </p>
            <p className="text-sm text-gray-600">
              {restaurants.filter(r => r.isCompleted).length} visited • {restaurants.filter(r => !r.isCompleted).length} to try
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
              restaurant.isCompleted
                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onRestaurantClick?.(restaurant)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm ${restaurant.isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                    {restaurant.isCompleted ? '✅' : '📍'}
                  </span>
                  <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                  {restaurant.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {restaurant.category}
                    </span>
                  )}
                </div>
                {restaurant.description && (
                  <p className="text-sm text-gray-600 mb-2">{restaurant.description}</p>
                )}
                <div className="flex gap-2 text-xs">
                  <a
                    href={restaurant.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📍 View on Maps
                  </a>
                  {restaurant.instagramUrl && (
                    <a
                      href={restaurant.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📷 Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
