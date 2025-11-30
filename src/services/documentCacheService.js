/**
 * Document Cache Service
 * Manages offline document caching with LRU eviction
 *
 * Features:
 * - On-demand caching (download on first view)
 * - LRU (Least Recently Used) eviction when cache is full
 * - Configurable cache size limit from Firebase
 * - Transparent to user (no cache indicators)
 * - Works completely offline once cached
 */

import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';
import { Image as ImageCompressor } from 'react-native-compressor';
import { getMaxCacheSize } from './cacheConfigService';
import { generateUniqueFilename, formatFileSize } from '../utils/fileUtils';

// Constants
const CACHE_ROOT = `${RNFS.DocumentDirectoryPath}/lexmate_cache`;
const CACHE_INDEX_KEY = '@lexmate_cache:index';
const BYTES_PER_MB = 1024 * 1024;
const CACHE_BUFFER_PERCENTAGE = 0.10; // Keep 10% safety buffer

// In-memory cache of index for performance
let _cacheIndex = null;

// Download queue to prevent duplicate downloads
const _downloadQueue = new Map();

/**
 * Initialize cache system
 * Creates directory structure and loads cache index
 *
 * @param {string} userId - User ID for directory organization
 * @returns {Promise<boolean>} - Success status
 */
export const initializeCache = async (userId) => {
  try {
    console.log('[Cache] Initializing cache system for user:', userId);

    // Create cache root directory
    const exists = await RNFS.exists(CACHE_ROOT);
    if (!exists) {
      await RNFS.mkdir(CACHE_ROOT);
      console.log('[Cache] Created cache root directory');
    }

    // Create user-specific documents directory
    const userDocsPath = `${CACHE_ROOT}/documents/user_${userId}`;
    const userDirExists = await RNFS.exists(userDocsPath);
    if (!userDirExists) {
      await RNFS.mkdir(userDocsPath);
      console.log('[Cache] Created user documents directory');
    }

    // Load cache index
    await loadCacheIndex();

    // Run integrity validation
    await validateCacheIntegrity();

    console.log('[Cache] Initialization complete');
    return true;
  } catch (error) {
    console.error('[Cache] Initialization error:', error);
    return false;
  }
};

/**
 * Load cache index from AsyncStorage
 *
 * @returns {Promise<object>} - Cache index
 */
const loadCacheIndex = async () => {
  try {
    const stored = await AsyncStorage.getItem(CACHE_INDEX_KEY);

    if (stored) {
      _cacheIndex = JSON.parse(stored);
      console.log('[Cache] Loaded index:', _cacheIndex.documentCount, 'documents,', (_cacheIndex.totalSize / BYTES_PER_MB).toFixed(2), 'MB');
    } else {
      // Create empty index
      _cacheIndex = {
        version: '1.0',
        totalSize: 0,
        documentCount: 0,
        documents: {},
      };
      console.log('[Cache] Created new empty index');
    }

    return _cacheIndex;
  } catch (error) {
    console.error('[Cache] Error loading index:', error);
    // Return empty index on error
    _cacheIndex = {
      version: '1.0',
      totalSize: 0,
      documentCount: 0,
      documents: {},
    };
    return _cacheIndex;
  }
};

/**
 * Save cache index to AsyncStorage
 *
 * @returns {Promise<void>}
 */
const saveCacheIndex = async () => {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(_cacheIndex));
  } catch (error) {
    console.error('[Cache] Error saving index:', error);
  }
};

/**
 * Get cached document or download if not cached
 *
 * @param {string} documentId - Document ID
 * @param {object} document - Document metadata from Firestore
 * @param {boolean} forceDownload - Force re-download even if cached
 * @returns {Promise<string>} - Local file path
 */
export const getCachedDocument = async (documentId, document, forceDownload = false) => {
  try {
    // Ensure index is loaded
    if (!_cacheIndex) {
      await loadCacheIndex();
    }

    // Check if already downloading
    if (_downloadQueue.has(documentId)) {
      console.log('[Cache] Download already in progress for:', documentId);
      return await _downloadQueue.get(documentId);
    }

    // Check cache
    const cacheEntry = _cacheIndex.documents[documentId];

    if (cacheEntry && !forceDownload) {
      // Verify file exists
      const exists = await RNFS.exists(cacheEntry.localPath);

      if (exists) {
        // Update last accessed timestamp (for LRU)
        cacheEntry.lastAccessed = Date.now();
        cacheEntry.accessCount = (cacheEntry.accessCount || 0) + 1;
        await saveCacheIndex();

        console.log('✅ [CACHE HIT] Document found in cache!');
        console.log('   📂 Path:', cacheEntry.localPath);
        console.log('   📊 Access count:', cacheEntry.accessCount, 'times');
        return cacheEntry.localPath;
      } else {
        // File missing - remove from index
        console.warn('⚠️  [Cache] File missing, removing from index:', documentId);
        delete _cacheIndex.documents[documentId];
        _cacheIndex.documentCount--;
        _cacheIndex.totalSize -= cacheEntry.size;
        await saveCacheIndex();
      }
    }

    // Not cached or force download - download it
    console.log('❌ [CACHE MISS] Document not in cache - downloading from Firebase...');
    return await downloadAndCache(documentId, document);
  } catch (error) {
    console.error('[Cache] Error getting cached document:', error);
    throw error;
  }
};

/**
 * Download and cache a document
 *
 * @param {string} documentId - Document ID
 * @param {object} document - Document metadata
 * @returns {Promise<string>} - Local file path
 */
const downloadAndCache = async (documentId, document) => {
  // Create download promise
  const downloadPromise = (async () => {
    try {
      // Get max cache size
      const maxSizeMB = await getMaxCacheSize();
      const maxSizeBytes = maxSizeMB * BYTES_PER_MB;

      // Check if we need to evict files
      const requiredSpace = document.size;
      const availableSpace = maxSizeBytes - _cacheIndex.totalSize;

      if (availableSpace < requiredSpace) {
        console.log('[Cache] Need to evict files. Required:', (requiredSpace / BYTES_PER_MB).toFixed(2), 'MB, Available:', (availableSpace / BYTES_PER_MB).toFixed(2), 'MB');
        await evictLRUDocuments(requiredSpace - availableSpace);
      }

      // Generate local file path
      const userId = document.userId || 'unknown';
      const caseId = document.caseId;
      const caseDir = `${CACHE_ROOT}/documents/user_${userId}/case_${caseId}`;

      // Ensure case directory exists
      const caseDirExists = await RNFS.exists(caseDir);
      if (!caseDirExists) {
        await RNFS.mkdir(caseDir);
      }

      const uniqueFilename = generateUniqueFilename(document.name);
      const tempPath = `${CACHE_ROOT}/temp_${uniqueFilename}`;
      const finalPath = `${caseDir}/${uniqueFilename}`;

      // Download to temp location first (atomic operation)
      console.log('📥 [DOWNLOAD] Starting download from Firebase Storage...');
      console.log('   🔗 URL:', document.downloadUrl.substring(0, 100) + '...');
      console.log('   📦 Expected size:', formatFileSize(document.size));

      const downloadResult = await RNFS.downloadFile({
        fromUrl: document.downloadUrl,
        toFile: tempPath,
        progressDivider: 10,
        begin: (res) => {
          console.log('📥 [DOWNLOAD] Started - Content length:', formatFileSize(res.contentLength));
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`📥 [DOWNLOAD] Progress: ${progress.toFixed(1)}% (${formatFileSize(res.bytesWritten)} / ${formatFileSize(res.contentLength)})`);
        }
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }

      console.log('✅ [DOWNLOAD] Complete!');

      // Verify file size
      let stats = await RNFS.stat(tempPath);
      console.log('   📊 Downloaded file size:', formatFileSize(stats.size));

      if (Math.abs(stats.size - document.size) > 1024) { // Allow 1KB tolerance
        console.warn('⚠️  [Cache] File size mismatch. Expected:', document.size, 'Got:', stats.size);
      }

      // Compress images to save space (WhatsApp-like auto compression)
      const isImage = document.type?.startsWith('image/') || document.name?.match(/\.(jpg|jpeg|png|webp)$/i);
      let originalSize = stats.size;
      let compressedSize = stats.size;
      let compressionSavings = 0;
      let fileToMove = tempPath; // Default to temp file

      if (isImage) {
        try {
          console.log('🗜️  [COMPRESS] Compressing image...');

          // Auto compress (WhatsApp-like) - compressor handles temp file cleanup
          const compressedPath = await ImageCompressor.compress(tempPath);

          // Get compressed file size
          const compressedStats = await RNFS.stat(compressedPath);
          compressedSize = compressedStats.size;
          compressionSavings = originalSize - compressedSize;
          const savingsPercent = ((compressionSavings / originalSize) * 100).toFixed(1);

          console.log('✅ [COMPRESS] Complete!');
          console.log('   📊 Original:', formatFileSize(originalSize), '→ Compressed:', formatFileSize(compressedSize));
          console.log('   💾 Saved:', formatFileSize(compressionSavings), `(${savingsPercent}%)`);

          // Use compressed file (compressor already cleaned up temp file)
          fileToMove = compressedPath;
          stats = compressedStats; // Update stats to compressed file
        } catch (compressionError) {
          console.warn('⚠️  [COMPRESS] Compression failed, using original file:', compressionError.message);
          // Continue with original file
          compressedSize = originalSize;
          compressionSavings = 0;
          fileToMove = tempPath;
        }
      }

      // Move to final location (either compressed or original file)
      await RNFS.moveFile(fileToMove, finalPath);
      console.log('📂 [CACHE] Saved to:', finalPath);

      // Update cache index
      _cacheIndex.documents[documentId] = {
        documentId,
        caseId,
        userId,
        name: document.name,
        type: document.type,
        size: stats.size, // Actual size (compressed if image)
        originalSize: originalSize, // Original download size
        compressionSavings: compressionSavings, // Bytes saved through compression
        localPath: finalPath,
        downloadUrl: document.downloadUrl,
        storagePath: document.storagePath,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
      };

      _cacheIndex.totalSize += stats.size;
      _cacheIndex.documentCount++;

      await saveCacheIndex();

      console.log('[Cache] Downloaded and cached:', documentId, '(', (stats.size / BYTES_PER_MB).toFixed(2), 'MB)');
      console.log('[Cache] Total cache size:', (_cacheIndex.totalSize / BYTES_PER_MB).toFixed(2), 'MB /', maxSizeMB, 'MB');

      return finalPath;
    } catch (error) {
      console.error('[Cache] Download error:', error);
      // Cleanup temp files if they exist (both original and compressed)
      try {
        const tempFiles = await RNFS.readDir(CACHE_ROOT);
        for (const file of tempFiles) {
          if (file.name.startsWith('temp_')) {
            await RNFS.unlink(file.path).catch(() => {});
          }
        }
      } catch (cleanupError) {
        console.warn('[Cache] Cleanup error:', cleanupError);
      }
      throw error;
    } finally {
      // Remove from download queue
      _downloadQueue.delete(documentId);
    }
  })();

  // Add to download queue
  _downloadQueue.set(documentId, downloadPromise);

  return downloadPromise;
};

/**
 * Evict documents using LRU (Least Recently Used) policy
 *
 * @param {number} bytesNeeded - Bytes to free up
 * @returns {Promise<number>} - Number of documents evicted
 */
const evictLRUDocuments = async (bytesNeeded) => {
  try {
    console.log('[Cache] Starting LRU eviction. Need to free:', (bytesNeeded / BYTES_PER_MB).toFixed(2), 'MB');

    // Get all documents and sort by lastAccessed (oldest first)
    const allDocs = Object.values(_cacheIndex.documents);
    allDocs.sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedBytes = 0;
    let evictedCount = 0;

    for (const doc of allDocs) {
      if (freedBytes >= bytesNeeded) break;

      // Delete file
      try {
        await RNFS.unlink(doc.localPath);
        console.log('[Cache] Evicted:', doc.name, '(last accessed:', new Date(doc.lastAccessed).toLocaleString(), ')');
      } catch (error) {
        console.warn('[Cache] Error deleting file:', doc.localPath, error);
      }

      // Remove from index
      delete _cacheIndex.documents[doc.documentId];
      freedBytes += doc.size;
      _cacheIndex.totalSize -= doc.size;
      _cacheIndex.documentCount--;
      evictedCount++;
    }

    await saveCacheIndex();

    console.log('[Cache] Evicted', evictedCount, 'documents, freed', (freedBytes / BYTES_PER_MB).toFixed(2), 'MB');
    return evictedCount;
  } catch (error) {
    console.error('[Cache] Eviction error:', error);
    return 0;
  }
};

/**
 * Check if document is cached
 *
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>}
 */
export const isDocumentCached = async (documentId) => {
  if (!_cacheIndex) {
    await loadCacheIndex();
  }

  const cacheEntry = _cacheIndex.documents[documentId];
  if (!cacheEntry) return false;

  // Verify file exists
  const exists = await RNFS.exists(cacheEntry.localPath);
  return exists;
};

/**
 * Get cache statistics
 *
 * @returns {Promise<object>} - { totalSize, totalSizeMB, documentCount, maxSizeMB, percentUsed, compressionSavings, compressionSavingsMB }
 */
export const getCacheStats = async () => {
  if (!_cacheIndex) {
    await loadCacheIndex();
  }

  const maxSizeMB = await getMaxCacheSize();
  const totalSizeMB = _cacheIndex.totalSize / BYTES_PER_MB;
  const percentUsed = (totalSizeMB / maxSizeMB) * 100;

  // Calculate total compression savings
  let totalCompressionSavings = 0;
  for (const doc of Object.values(_cacheIndex.documents)) {
    if (doc.compressionSavings) {
      totalCompressionSavings += doc.compressionSavings;
    }
  }

  const compressionSavingsMB = totalCompressionSavings / BYTES_PER_MB;

  return {
    totalSize: _cacheIndex.totalSize,
    totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
    documentCount: _cacheIndex.documentCount,
    maxSizeMB,
    percentUsed: parseFloat(percentUsed.toFixed(1)),
    compressionSavings: totalCompressionSavings,
    compressionSavingsMB: parseFloat(compressionSavingsMB.toFixed(2)),
  };
};

/**
 * Remove specific document from cache
 *
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeCachedDocument = async (documentId) => {
  try {
    if (!_cacheIndex) {
      await loadCacheIndex();
    }

    const cacheEntry = _cacheIndex.documents[documentId];
    if (!cacheEntry) {
      console.log('[Cache] Document not cached:', documentId);
      return true; // Not an error
    }

    // Delete file
    await RNFS.unlink(cacheEntry.localPath).catch((error) => {
      console.warn('[Cache] Error deleting file (may not exist):', error);
    });

    // Remove from index
    delete _cacheIndex.documents[documentId];
    _cacheIndex.totalSize -= cacheEntry.size;
    _cacheIndex.documentCount--;

    await saveCacheIndex();

    console.log('[Cache] Removed:', documentId);
    return true;
  } catch (error) {
    console.error('[Cache] Error removing document:', error);
    return false;
  }
};

/**
 * Clear entire cache for a user
 *
 * @param {string} userId - User ID (optional, clears all if not provided)
 * @returns {Promise<boolean>} - Success status
 */
export const clearCache = async (userId = null) => {
  try {
    console.log('[Cache] Clearing cache for user:', userId || 'all');

    if (userId) {
      // Clear specific user's cache
      const userDir = `${CACHE_ROOT}/documents/user_${userId}`;
      const exists = await RNFS.exists(userDir);

      if (exists) {
        await RNFS.unlink(userDir);
        console.log('[Cache] Deleted user directory');
      }

      // Remove user's documents from index
      const documentsToRemove = [];
      for (const [docId, doc] of Object.entries(_cacheIndex.documents)) {
        if (doc.userId === userId) {
          documentsToRemove.push(docId);
          _cacheIndex.totalSize -= doc.size;
          _cacheIndex.documentCount--;
        }
      }

      documentsToRemove.forEach(docId => {
        delete _cacheIndex.documents[docId];
      });
    } else {
      // Clear entire cache
      const exists = await RNFS.exists(CACHE_ROOT);
      if (exists) {
        await RNFS.unlink(CACHE_ROOT);
        await RNFS.mkdir(CACHE_ROOT);
      }

      // Reset index
      _cacheIndex = {
        version: '1.0',
        totalSize: 0,
        documentCount: 0,
        documents: {},
      };
    }

    await saveCacheIndex();
    console.log('[Cache] Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
    return false;
  }
};

/**
 * Get list of cached documents with metadata
 *
 * @returns {Promise<Array>} - Array of cached document objects, sorted by lastAccessed descending
 */
export const getCachedDocumentsList = async () => {
  if (!_cacheIndex) {
    await loadCacheIndex();
  }

  const documents = Object.values(_cacheIndex.documents);

  // Sort by last accessed (most recent first)
  documents.sort((a, b) => b.lastAccessed - a.lastAccessed);

  return documents;
};

/**
 * Validate cache integrity
 * Removes orphaned entries and fixes size discrepancies
 *
 * @returns {Promise<void>}
 */
const validateCacheIntegrity = async () => {
  try {
    console.log('[Cache] Validating cache integrity...');

    if (!_cacheIndex) {
      await loadCacheIndex();
    }

    const missingFiles = [];
    let actualTotalSize = 0;

    // Check each cached file
    for (const [docId, doc] of Object.entries(_cacheIndex.documents)) {
      try {
        const exists = await RNFS.exists(doc.localPath);
        if (!exists) {
          missingFiles.push(docId);
        } else {
          const stats = await RNFS.stat(doc.localPath);
          actualTotalSize += stats.size;
        }
      } catch (error) {
        console.warn('[Cache] Error checking file:', doc.localPath, error);
        missingFiles.push(docId);
      }
    }

    // Remove missing files from index
    if (missingFiles.length > 0) {
      console.log('[Cache] Removing', missingFiles.length, 'orphaned entries');
      missingFiles.forEach(docId => {
        delete _cacheIndex.documents[docId];
        _cacheIndex.documentCount--;
      });
    }

    // Update total size
    _cacheIndex.totalSize = actualTotalSize;

    await saveCacheIndex();

    console.log('[Cache] Integrity validation complete. Size:', (actualTotalSize / BYTES_PER_MB).toFixed(2), 'MB');
  } catch (error) {
    console.error('[Cache] Integrity validation error:', error);
  }
};

/**
 * Preload documents in background (bulk download)
 *
 * @param {Array<object>} documents - Array of document objects
 * @param {function} progressCallback - Called with progress percentage
 * @returns {Promise<number>} - Number of documents successfully cached
 */
export const preloadDocuments = async (documents, progressCallback) => {
  try {
    console.log('[Cache] Preloading', documents.length, 'documents...');

    let completed = 0;
    const total = documents.length;

    for (const doc of documents) {
      try {
        // Skip if already cached
        const cached = await isDocumentCached(doc.id);
        if (!cached) {
          await downloadAndCache(doc.id, doc);
        }
      } catch (error) {
        console.error('[Cache] Error preloading document:', doc.id, error);
      }

      completed++;
      if (progressCallback) {
        progressCallback(Math.round((completed / total) * 100));
      }
    }

    console.log('[Cache] Preload complete:', completed, '/', total);
    return completed;
  } catch (error) {
    console.error('[Cache] Preload error:', error);
    return 0;
  }
};
