import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/lib/database';

// GET /api/stats - Get restaurant statistics
export async function GET() {
  try {
    const repository = new RestaurantRepository();
    const stats = repository.getStats();
    
    // Calculate additional stats
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const pending = stats.total - stats.completed;
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        pending,
        completionRate
      }
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
