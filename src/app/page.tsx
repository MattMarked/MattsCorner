'use client';

import { useState, useEffect } from 'react';
import RestaurantMap from '@/components/RestaurantMap';
import { Restaurant } from '@/lib/parser';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/restaurants').then(res => res.json()),
      fetch('/api/stats').then(res => res.json())
    ])
    .then(([restaurantsRes, statsRes]) => {
      if (restaurantsRes.success) {
        setRestaurants(restaurantsRes.data);
        setFilteredRestaurants(restaurantsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, []);

  const handleFilterChange = (filters: {
    search?: string;
  }) => {
    let filtered = [...restaurants];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    
    try {
      const refreshResponse = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' }),
      });
      
      const refreshResult = await refreshResponse.json();
      
      if (refreshResult.success) {
        const [restaurantsRes, statsRes] = await Promise.all([
          fetch('/api/restaurants').then(res => res.json()),
          fetch('/api/stats').then(res => res.json())
        ]);
        
        if (restaurantsRes.success) {
          setRestaurants(restaurantsRes.data);
          setFilteredRestaurants(restaurantsRes.data);
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
        
        setRefreshMessage(`✅ Refreshed!`);
      } else {
        setRefreshMessage(`❌ Error: ${refreshResult.error}`);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshMessage('❌ Failed to refresh');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    // Popup handled by Leaflet
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Matt&apos;s Corner...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b z-50">
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🍽️ Matt&apos;s Corner</h1>
              <p className="text-xs text-gray-600">Dublin Food Discovery Map</p>
            </div>
            
            <div className="flex items-center gap-4">
              {refreshMessage && (
                <span className="text-sm font-medium">
                  {refreshMessage}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  refreshing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Map */}
      <div className="flex-1 relative">
        <RestaurantMap
          restaurants={filteredRestaurants}
          onRestaurantClick={handleRestaurantClick}
        />
      </div>
    </main>
  );
}
