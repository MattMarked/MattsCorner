'use client';

import { useState } from 'react';

interface RestaurantFiltersProps {
  categories: string[];
  onFilterChange: (filters: {
    category?: string;
    status?: 'all' | 'completed' | 'pending';
    search?: string;
  }) => void;
}

export default function RestaurantFilters({ categories, onFilterChange }: RestaurantFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onFilterChange({
      category: category || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchTerm || undefined
    });
  };

  const handleStatusChange = (status: 'all' | 'completed' | 'pending') => {
    setSelectedStatus(status);
    onFilterChange({
      category: selectedCategory || undefined,
      status: status !== 'all' ? status : undefined,
      search: searchTerm || undefined
    });
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    onFilterChange({
      category: selectedCategory || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: search || undefined
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('all');
    setSearchTerm('');
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {(selectedCategory || selectedStatus !== 'all' || searchTerm) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search restaurants
        </label>
        <input
          type="text"
          id="search"
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All', count: null },
            { value: 'completed', label: 'Visited', count: null },
            { value: 'pending', label: 'To Try', count: null }
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === status.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
