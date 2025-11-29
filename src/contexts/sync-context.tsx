'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SyncContextType {
  isSyncing: boolean;
  startSync: () => void;
  endSync: () => void;
  triggerRefresh: () => void;
  refreshKey: number;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const startSync = useCallback(() => {
    setIsSyncing(true);
  }, []);

  const endSync = useCallback(() => {
    setIsSyncing(false);
    // Trigger a refresh in components listening to sync completion
    setRefreshKey(prev => prev + 1);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <SyncContext.Provider value={{ isSyncing, startSync, endSync, triggerRefresh, refreshKey }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}
