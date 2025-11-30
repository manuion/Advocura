/**
 * Cache Configuration Service
 * Manages fetching and caching of cache configuration from Firebase
 *
 * Strategy:
 * - On login: Check AsyncStorage → if empty, fetch from Firebase → cache locally
 * - During session: Use local cached value (NO Firebase hits)
 * - On logout: Clear cached config
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

// AsyncStorage key for cache size config
const CACHE_SIZE_KEY = '@lexmate_cache:max_size';

// Default cache size in MB (fallback if Firebase fetch fails)
const DEFAULT_CACHE_SIZE_MB = 300;

/**
 * Get maximum cache size in MB
 * First checks AsyncStorage, then fetches from Firebase if not cached
 *
 * @returns {Promise<number>} - Max cache size in MB
 */
export const getMaxCacheSize = async () => {
  try {
    // 1. Check AsyncStorage first (fast, no network hit)
    const cached = await AsyncStorage.getItem(CACHE_SIZE_KEY);

    if (cached !== null) {
      console.log('[CacheConfig] Using cached max size:', cached, 'MB');
      return parseInt(cached, 10);
    }

    // 2. Not cached - fetch from Firebase
    console.log('[CacheConfig] Cache size not found locally, fetching from Firebase...');
    const maxSize = await fetchConfigFromFirebase();

    // 3. Save to AsyncStorage for this session
    await AsyncStorage.setItem(CACHE_SIZE_KEY, maxSize.toString());
    console.log('[CacheConfig] Cached max size locally:', maxSize, 'MB');

    return maxSize;
  } catch (error) {
    console.error('[CacheConfig] Error getting max cache size:', error);
    // Return default on any error
    return DEFAULT_CACHE_SIZE_MB;
  }
};

/**
 * Fetch cache configuration from Firebase Firestore
 *
 * @returns {Promise<number>} - Max cache size in MB
 */
const fetchConfigFromFirebase = async () => {
  try {
    const configSnap = await firestore()
      .collection('app_config')
      .doc('cache_settings')
      .get();

    if (!configSnap.exists) {
      console.warn('[CacheConfig] Firebase config document not found, using default');
      return DEFAULT_CACHE_SIZE_MB;
    }

    const data = configSnap.data();
    const maxSize = data?.maxCacheSizeMB || DEFAULT_CACHE_SIZE_MB;

    console.log('[CacheConfig] Fetched from Firebase:', maxSize, 'MB');
    return maxSize;
  } catch (error) {
    console.error('[CacheConfig] Error fetching from Firebase:', error);
    return DEFAULT_CACHE_SIZE_MB;
  }
};

/**
 * Clear cached configuration
 * Called on logout to force fresh fetch on next login
 *
 * @returns {Promise<void>}
 */
export const clearCachedConfig = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_SIZE_KEY);
    console.log('[CacheConfig] Cleared cached config');
  } catch (error) {
    console.error('[CacheConfig] Error clearing cached config:', error);
  }
};

/**
 * Manually refresh configuration from Firebase
 * Useful for admin/settings UI to force config update
 *
 * @returns {Promise<number>} - Updated max cache size in MB
 */
export const refreshConfig = async () => {
  try {
    console.log('[CacheConfig] Manually refreshing config from Firebase...');

    // Fetch fresh from Firebase
    const maxSize = await fetchConfigFromFirebase();

    // Update local cache
    await AsyncStorage.setItem(CACHE_SIZE_KEY, maxSize.toString());

    console.log('[CacheConfig] Config refreshed:', maxSize, 'MB');
    return maxSize;
  } catch (error) {
    console.error('[CacheConfig] Error refreshing config:', error);
    return DEFAULT_CACHE_SIZE_MB;
  }
};

/**
 * Get cached config value without fetching from Firebase
 * Useful for checking if user has logged in before
 *
 * @returns {Promise<number|null>} - Cached max size or null if not cached
 */
export const getCachedConfigValue = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_SIZE_KEY);
    return cached !== null ? parseInt(cached, 10) : null;
  } catch (error) {
    console.error('[CacheConfig] Error getting cached value:', error);
    return null;
  }
};
