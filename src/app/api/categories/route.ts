import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/lib/database';

// GET /api/categories - Get all unique categories
export async function GET() {
  try {
    const repository = new RestaurantRepository();
    const categories = repository.getAllCategories();
    
    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
