'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function LastUpdated() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastSync();
    // Optionally refresh every 30 seconds
    const interval = setInterval(fetchLastSync, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="text-xs text-muted-foreground">
      {lastUpdate ? `Last updated ${lastUpdate}` : 'Never synced'}
    </div>
  );
}
