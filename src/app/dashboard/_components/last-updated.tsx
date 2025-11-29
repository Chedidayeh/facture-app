'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function LastUpdated() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLastSync() {
      try {
        const response = await fetch('/api/sync/status');
        const data = await response.json();

        if (data.lastExecutionTime) {
          const formattedTime = formatDistanceToNow(new Date(data.lastExecutionTime), {
            addSuffix: true,
          });
          setLastUpdate(formattedTime);
        }
        
        // Set error message if sync failed
        if (data.status === 'failed' && data.errorMessage) {
          setErrorMessage(data.errorMessage);
        } else {
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastSync();
    
    // Listen for sync completion event
    const handleSyncCompleted = () => {
      console.log('🔄 Sync completed, refreshing last update time...');
      fetchLastSync();
    };
    
    window.addEventListener('syncCompleted', handleSyncCompleted);
    
    // Optionally refresh every 30 seconds
    const interval = setInterval(fetchLastSync, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('syncCompleted', handleSyncCompleted);
    };
  }, []);

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="text-xs text-muted-foreground">
      {lastUpdate ? `Last updated ${lastUpdate}` : 'Never synced'}
      {errorMessage && (
        <span className="ml-2 text-destructive">• Error: {errorMessage}</span>
      )}
    </div>
  );
}
