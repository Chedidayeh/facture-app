/**
 * Cache utilities for BigQuery results
 * Reduces BigQuery costs by caching query results in PostgreSQL
 */

import { db } from "@/db";

// Match the sync cooldown time
const CACHE_DURATION_MINUTES = 5;

interface CacheOptions {
  statsKey: string;
  syncName?: string;
}

/**
 * Get cached data if available and not expired
 */
export async function getCachedData<T>(
  statsKey: string
): Promise<T | null> {
  try {
    const cachedStats = await db.cachedStats.findUnique({
      where: { statsKey },
    });

    if (cachedStats && cachedStats.expiresAt > new Date()) {
      console.log(`✅ Cache hit for: ${statsKey}`);
      return cachedStats.data as T;
    }

    console.log(`❌ Cache miss for: ${statsKey}`);
    return null;
  } catch (error) {
    console.error(`Error reading cache for ${statsKey}:`, error);
    return null;
  }
}

/**
 * Store data in cache
 */
export async function setCachedData<T>(
  statsKey: string,
  data: T,
  options?: { syncName?: string; durationMinutes?: number }
): Promise<void> {
  try {
    const duration = options?.durationMinutes || CACHE_DURATION_MINUTES;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    await db.cachedStats.upsert({
      where: { statsKey },
      create: {
        statsKey,
        data: data as any,
        expiresAt,
        syncName: options?.syncName || "users_latest_sync",
      },
      update: {
        data: data as any,
        expiresAt,
        cachedAt: new Date(),
      },
    });

    console.log(`💾 Cached data for: ${statsKey}`);
  } catch (error) {
    console.error(`Error caching data for ${statsKey}:`, error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Invalidate cache for a specific key or all caches for a sync
 */
export async function invalidateCache(
  options: { statsKey?: string; syncName?: string } = {}
): Promise<void> {
  try {
    if (options.statsKey) {
      await db.cachedStats.delete({
        where: { statsKey: options.statsKey },
      });
      console.log(`🗑️ Invalidated cache: ${options.statsKey}`);
    } else if (options.syncName) {
      await db.cachedStats.deleteMany({
        where: { syncName: options.syncName },
      });
      console.log(`🗑️ Invalidated all caches for sync: ${options.syncName}`);
    }
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
}

/**
 * Helper to wrap a query function with caching
 */
export async function withCache<T>(
  statsKey: string,
  queryFn: () => Promise<T>,
  options?: { syncName?: string; durationMinutes?: number }
): Promise<T> {
  // Try to get from cache first
  const cached = await getCachedData<T>(statsKey);
  if (cached !== null) {
    return cached;
  }

  // Execute the query
  const data = await queryFn();

  // Cache the result
  await setCachedData(statsKey, data, options);

  return data;
}
