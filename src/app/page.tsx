'use client';

import { useState, useEffect } from 'react';
import RestaurantMap from '@/components/RestaurantMap';
import RestaurantFilters from '@/components/RestaurantFilters';
import { Restaurant } from '@/lib/parser';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/restaurants').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/stats').then(res => res.json())
    ])
    .then(([restaurantsRes, categoriesRes, statsRes]) => {
      if (restaurantsRes.success) {
        setRestaurants(restaurantsRes.data);
        setFilteredRestaurants(restaurantsRes.data);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
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
    category?: string;
    status?: 'all' | 'completed' | 'pending';
    search?: string;
  }) => {
    let filtered = [...restaurants];

    if (filters.category) {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(r => 
        filters.status === 'completed' ? r.isCompleted : !r.isCompleted
      );
    }

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
      // Call refresh API
      const refreshResponse = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' }),
      });
      
      const refreshResult = await refreshResponse.json();
      
      if (refreshResult.success) {
        // Refresh all data after successful refresh
        const [restaurantsRes, categoriesRes, statsRes] = await Promise.all([
          fetch('/api/restaurants').then(res => res.json()),
          fetch('/api/categories').then(res => res.json()),
          fetch('/api/stats').then(res => res.json())
        ]);
        
        if (restaurantsRes.success) {
          setRestaurants(restaurantsRes.data);
          setFilteredRestaurants(restaurantsRes.data);
        }
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
        
        setRefreshMessage(`✅ Successfully refreshed ${refreshResult.count} restaurants`);
      } else {
        setRefreshMessage(`❌ Error: ${refreshResult.error}`);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshMessage('❌ Failed to refresh data');
    } finally {
      setRefreshing(false);
      // Clear message after 3 seconds
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    // We can still keep the handler if needed for other logic, 
    // but for now it does nothing as we use Leaflet Popups
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Matt&apos;s Corner...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🍽️ Matt&apos;s Corner</h1>
              <p className="text-xs text-gray-600">Dublin Food Discovery Map</p>
            </div>
            
            <div className="flex items-center gap-4">
              {refreshMessage && (
                <span className="text-sm font-medium animate-fade-in">
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
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                    Refreshing...
                  </>
                ) : (
                  <>🔄 Refresh</>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Map */}
      <div className="flex-1 relative min-h-[500px]">
        <RestaurantMap
          restaurants={filteredRestaurants}
          onRestaurantClick={handleRestaurantClick}
        />
        
        {/* Floating Search (Optional, since filters were removed) */}
        <div className="absolute top-4 left-4 z-[1000] w-64">
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border">
            <input
              type="text"
              placeholder="Search restaurants..."
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Floating Stats Counter */}
        {stats && (
          <div className="absolute bottom-6 left-6 z-[1000] flex gap-2">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border text-xs font-semibold">
              <span className="text-blue-700">{stats.total}</span> spots
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border text-xs font-semibold">
              <span className="text-green-700">{stats.completed}</span> visited
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
