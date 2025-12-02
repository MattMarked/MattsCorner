import { NextRequest, NextResponse } from 'next/server';
import { RestaurantRepository } from '@/lib/database';
import { parseMarkdownToRestaurants } from '@/lib/parser';
import fs from 'fs';
import path from 'path';

// GET /api/restaurants - Get all restaurants with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // 'completed' | 'pending'
    const search = searchParams.get('search');
    
    const repository = new RestaurantRepository();
    
    // Auto-initialize database if empty
    const existingRestaurants = repository.getAllRestaurants();
    if (existingRestaurants.length === 0) {
      console.log('Database is empty, auto-initializing from markdown...');
      const markdownPath = '/Users/mttimar/Dropbox/ObsydianVault/Food/Dublin food - to try.md';
      
      if (fs.existsSync(markdownPath)) {
        const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
        const restaurants = parseMarkdownToRestaurants(markdownContent);
        
        if (restaurants.length > 0) {
          repository.upsertRestaurants(restaurants);
          console.log(`Auto-initialized database with ${restaurants.length} restaurants`);
        }
      }
    }
    
    let restaurants;
    
    if (search) {
      restaurants = repository.searchRestaurants(search);
    } else if (category) {
      restaurants = repository.getRestaurantsByCategory(category);
    } else if (status) {
      const isCompleted = status === 'completed';
      restaurants = repository.getRestaurantsByStatus(isCompleted);
    } else {
      restaurants = repository.getAllRestaurants();
    }
    
    return NextResponse.json({
      success: true,
      data: restaurants,
      count: restaurants.length
    });
    
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

// POST /api/restaurants - Update restaurant status or refresh from markdown
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repository = new RestaurantRepository();
    
    // Handle different POST operations
    if (body.action === 'refresh') {
      // Refresh data from markdown file
      const markdownPath = '/Users/mttimar/Dropbox/ObsydianVault/Food/Dublin food - to try.md';
      
      if (!fs.existsSync(markdownPath)) {
        return NextResponse.json(
          { success: false, error: 'Markdown file not found' },
          { status: 404 }
        );
      }
      
      const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
      const restaurants = parseMarkdownToRestaurants(markdownContent);
      
      // Update database
      repository.upsertRestaurants(restaurants);
      
      return NextResponse.json({
        success: true,
        message: `Refreshed ${restaurants.length} restaurants from markdown`,
        count: restaurants.length
      });
      
    } else if (body.action === 'update-status' && body.id && typeof body.isCompleted === 'boolean') {
      // Update individual restaurant status
      repository.updateRestaurantStatus(body.id, body.isCompleted);
      
      return NextResponse.json({
        success: true,
        message: 'Restaurant status updated'
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error in POST /api/restaurants:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
