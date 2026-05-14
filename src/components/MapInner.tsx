'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Restaurant } from '@/lib/parser';
import { getRestaurantIconHex } from '@/lib/icon-strategy';

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

export default function MapInner({ restaurants, center, zoom, onRestaurantClick }: MapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      scrollWheelZoom: true,
    });

    // Add TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create a layer group for markers
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    // Trigger invalidateSize to ensure correct rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Only once on mount

  // Update Markers and Center
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    if (restaurants.length > 0) {
      const latLngs: L.LatLngExpression[] = [];

      restaurants.forEach((restaurant) => {
        const position: L.LatLngExpression = [restaurant.coordinates.lat, restaurant.coordinates.lng];
        latLngs.push(position);

        // Use the new icon selection strategy
        const hex = getRestaurantIconHex(restaurant.name, restaurant.description, restaurant.category);
        const iconUrl = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`;

        const customIcon = L.divIcon({
          html: `<div style="
            width: 60px; 
            height: 60px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            filter: drop-shadow(0 4px 5px rgba(0,0,0,0.5));
          ">
            <img src="${iconUrl}" style="width: 50px; height: 50px;" alt="${restaurant.category}" />
          </div>`,
          className: 'custom-emoji-marker',
          iconSize: [60, 60],
          iconAnchor: [30, 30],
          popupAnchor: [0, -25],
        });

        const marker = L.marker(position, { icon: customIcon });
        
        const popupContent = renderToStaticMarkup(
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
                📍 Adress
              </a>
              {restaurant.instagramUrl && (
                <a
                  href={restaurant.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium text-center no-underline hover:bg-purple-700 transition-colors"
                >
                  🔗 Insta
                </a>
              )}
            </div>
          </div>
        );

        marker.bindPopup(popupContent);
        
        if (onRestaurantClick) {
          marker.on('click', () => onRestaurantClick(restaurant));
        }

        markersLayer.addLayer(marker);
      });

      map.setView([center.lat, center.lng], zoom, { animate: true });
    } else {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [restaurants, center.lat, center.lng, zoom, onRestaurantClick]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
