'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '@/lib/parser';

// Fix for default icon issues with Leaflet in Next.js
// This is necessary because Webpack/Next.js changes the paths to the marker images
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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
  // Initial center and zoom
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
            <div className="font-semibold">{restaurant.name}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
