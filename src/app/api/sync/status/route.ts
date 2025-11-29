import { db } from '@/db';
import { NextResponse } from 'next/server';

const SYNC_NAME = 'users_latest_sync';

export async function GET() {
  try {
    const syncLog = await db.syncLog.findUnique({
      where: { syncName: SYNC_NAME },
    });

    if (!syncLog) {
      return NextResponse.json({
        lastExecutionTime: null,
        status: 'never_run',
      });
    }

    return NextResponse.json({
      lastExecutionTime: syncLog.lastExecutionTime,
      status: syncLog.status,
      recordsProcessed: syncLog.recordsProcessed,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
