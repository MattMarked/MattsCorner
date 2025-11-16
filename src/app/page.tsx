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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

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

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍽️ Matt&apos;s Corner</h1>
              <p className="text-sm text-gray-600">Dublin Food Discovery Map</p>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="font-semibold text-blue-800">{stats.total}</span> restaurants
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="font-semibold text-green-800">{stats.completed}</span> visited
                </div>
                <div className="bg-orange-100 px-3 py-1 rounded-full">
                  <span className="font-semibold text-orange-800">{stats.pending}</span> to try
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <RestaurantFilters
              categories={categories}
              onFilterChange={handleFilterChange}
            />
            
            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total restaurants:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visited:</span>
                    <span className="font-semibold text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To try:</span>
                    <span className="font-semibold text-orange-600">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span className="font-semibold">{stats.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span className="font-semibold">{stats.categories}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Restaurant Map
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                </div>
              </div>
              
              <RestaurantMap
                restaurants={filteredRestaurants}
                onRestaurantClick={handleRestaurantClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRestaurant(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedRestaurant.name}
              </h3>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedRestaurant.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {selectedRestaurant.category}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-sm rounded-full ${
                  selectedRestaurant.isCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {selectedRestaurant.isCompleted ? '✅ Visited' : '📍 To Try'}
                </span>
              </div>
              
              {selectedRestaurant.description && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Description:</span>
                  <p className="text-gray-800">{selectedRestaurant.description}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <a
                  href={selectedRestaurant.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                >
                  📍 View on Maps
                </a>
                {selectedRestaurant.instagramUrl && (
                  <a
                    href={selectedRestaurant.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-center text-sm font-medium"
                  >
                    📷 Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
