import { runUsersLatestSync } from '@/server/sync-service';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await runUsersLatestSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json(
      { 
        ranSync: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
