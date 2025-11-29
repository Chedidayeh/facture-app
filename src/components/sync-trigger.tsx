/**
 * Sync trigger for layout - runs the sync service if cooldown has passed
 * Shows a loading spinner while sync is in progress
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export function SyncTrigger() {
  const [isSyncing, setIsSyncing] = useState(false);
  const hasTriggeredSync = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Prevent duplicate sync calls
    if (hasTriggeredSync.current) {
      return;
    }

    async function triggerSync() {
      try {
        hasTriggeredSync.current = true;
        setIsSyncing(true);
        
        const response = await fetch('/api/sync/trigger', {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (data.ranSync) {
          console.log('✅ Sync completed:', data.message);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('syncCompleted'));
          // Use router.refresh() instead of window.location.reload()
          // This refreshes server components without a full page reload
          router.refresh();
          setIsSyncing(false);
        } else {
          console.log('ℹ️ Sync skipped:', data.message);
          setIsSyncing(false);
        }
      } catch (error) {
        console.error('Background sync error:', error);
        setIsSyncing(false);
      }
    }

    triggerSync();
  }, [router]);

  if (!isSyncing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Syncing data...</p>
      </div>
    </div>
  );
}
