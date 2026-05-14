'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Restaurant } from '@/lib/parser';

// Fix for default icon issues with Leaflet in Next.js
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [12, 20],      // Standard is [25, 41]
    iconAnchor: [6, 20],     // Standard is [12, 41]
    popupAnchor: [1, -17],   // Standard is [1, -34]
    shadowSize: [20, 20],    // Standard is [41, 41]
  });
}

interface RestaurantWithCoords extends Restaurant {
  coordinates: { lat: number; lng: number };
}

interface MapInnerProps {
  restaurants: RestaurantWithCoords[];
  center: { lat: number; lng: number };
  zoom: number;
  onRestaurantClick?: (restaurant: RestaurantWithCoords) => void;
}

// Component to handle bounds/center updates
function ChangeView({ center, zoom, restaurants }: { center: [number, number], zoom: number, restaurants: RestaurantWithCoords[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (restaurants.length > 0) {
      const bounds = L.latLngBounds(restaurants.map(r => [r.coordinates.lat, r.coordinates.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView(center, zoom);
    }
  }, [restaurants, center, zoom, map]);
  
  return null;
}

export default function MapInner({ restaurants, center, zoom, onRestaurantClick }: MapInnerProps) {
  const initialCenter: [number, number] = [center.lat, center.lng];

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={zoom} 
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={initialCenter} zoom={zoom} restaurants={restaurants} />
      {restaurants.map((restaurant) => (
        <Marker 
          key={restaurant.id} 
          position={[restaurant.coordinates.lat, restaurant.coordinates.lng]}
          eventHandlers={{
            click: () => onRestaurantClick?.(restaurant)
          }}
        >
          <Popup>
            <div className="min-w-[200px] py-1">
              <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {restaurant.category && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded-full">
                    {restaurant.category}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  restaurant.isCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {restaurant.isCompleted ? '✅ Visited' : '📍 To Try'}
                </span>
              </div>
              
              {restaurant.description && (
                <p className="text-sm text-gray-700 mb-3 leading-snug">
                  {restaurant.description}
                </p>
              )}
              
              <div className="flex gap-2 pt-1">
                <a
                  href={restaurant.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium text-center no-underline hover:bg-blue-700 transition-colors"
                >
                  📍 Maps
                </a>
                {restaurant.instagramUrl && (
                  <a
                    href={restaurant.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium text-center no-underline hover:bg-purple-700 transition-colors"
                  >
                    🔗 Link
                  </a>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
