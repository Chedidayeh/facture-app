/**
 * Sync trigger for layout - runs the sync service if cooldown has passed
 * This component wraps the layout and triggers the sync on app initialization
 */

"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export function SyncTrigger() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const runSync = async () => {
      try {
        const response = await fetch("/api/sync");
        const result = await response.json();
        
        // Only show spinner if sync actually ran
        if (result.shouldRun) {
          setIsSyncing(true);
          // Keep spinner visible for a brief moment to show completion
          setTimeout(() => setIsSyncing(false), 500);
        }
        
        console.log("Sync status:", result);
      } catch (error) {
        console.error("Background sync error:", error);
      }
    };

    runSync();
  }, []);

  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Syncing data...</p>
      </div>
    </div>
  );
}
