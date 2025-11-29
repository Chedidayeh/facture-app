/**
 * Sync trigger for layout - runs the sync service if cooldown has passed
 * This component wraps the layout and triggers the sync on app initialization
 */

"use client";

import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSyncContext } from "@/contexts/sync-context";

export function SyncTrigger() {
  const { isSyncing, startSync, endSync } = useSyncContext();

  useEffect(() => {
    const runSync = async () => {
      try {
        // Show spinner immediately when starting sync
        startSync();
        
        const response = await fetch("/api/sync");
        const result = await response.json();
        
        console.log("Sync status:", result);
        
        // Keep spinner visible for a brief moment to show completion
        setTimeout(() => endSync(), 500);
      } catch (error) {
        console.error("Background sync error:", error);
        endSync();
      }
    };

    runSync();
  }, [startSync, endSync]);

  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Syncing data...</p>
      </div>
    </div>
  );
}
