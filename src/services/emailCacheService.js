/**
 * Email Cache Service
 * Manages offline email caching with LRU eviction
 *
 * Features:
 * - Cache emails for offline viewing
 * - LRU (Least Recently Used) eviction when cache is full
 * - Configurable cache size limit (200 MB)
 * - Works completely offline once cached
 */

import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const EMAIL_CACHE_ROOT = `${RNFS.DocumentDirectoryPath}/lexmate_email_cache`;
const EMAIL_CACHE_INDEX_KEY = '@lexmate_email_cache:index';
const BYTES_PER_MB = 1024 * 1024;
const MAX_CACHE_SIZE_MB = 200; // 200 MB limit for emails

// In-memory cache of index for performance
let _emailCacheIndex = null;

/**
 * Initialize email cache system
 *
 * @returns {Promise<boolean>} - Success status
 */
export const initializeEmailCache = async () => {
    try {
        console.log('[EmailCache] Initializing email cache system');

        // Create cache root directory
        const exists = await RNFS.exists(EMAIL_CACHE_ROOT);
        if (!exists) {
            await RNFS.mkdir(EMAIL_CACHE_ROOT);
            console.log('[EmailCache] Created cache root directory');
        }

        // Create emails directory
        const emailsDir = `${EMAIL_CACHE_ROOT}/emails`;
        const emailsDirExists = await RNFS.exists(emailsDir);
        if (!emailsDirExists) {
            await RNFS.mkdir(emailsDir);
            console.log('[EmailCache] Created emails directory');
        }

        // Load cache index
        await loadEmailCacheIndex();

        // Run integrity validation
        await validateEmailCacheIntegrity();

        console.log('[EmailCache] Initialization complete');
        return true;
    } catch (error) {
        console.error('[EmailCache] Initialization error:', error);
        return false;
    }
};

/**
 * Load email cache index from AsyncStorage
 *
 * @returns {Promise<object>} - Cache index
 */
const loadEmailCacheIndex = async () => {
    try {
        const stored = await AsyncStorage.getItem(EMAIL_CACHE_INDEX_KEY);

        if (stored) {
            _emailCacheIndex = JSON.parse(stored);
            console.log('[EmailCache] Loaded index:', _emailCacheIndex.emailCount, 'emails,', (_emailCacheIndex.totalSize / BYTES_PER_MB).toFixed(2), 'MB');
        } else {
            // Create empty index
            _emailCacheIndex = {
                version: '1.0',
                totalSize: 0,
                emailCount: 0,
                emails: {},
            };
            console.log('[EmailCache] Created new empty index');
        }

        return _emailCacheIndex;
    } catch (error) {
        console.error('[EmailCache] Error loading index:', error);
        // Return empty index on error
        _emailCacheIndex = {
            version: '1.0',
            totalSize: 0,
            emailCount: 0,
            emails: {},
        };
        return _emailCacheIndex;
    }
};

/**
 * Save email cache index to AsyncStorage
 *
 * @returns {Promise<void>}
 */
const saveEmailCacheIndex = async () => {
    try {
        await AsyncStorage.setItem(EMAIL_CACHE_INDEX_KEY, JSON.stringify(_emailCacheIndex));
    } catch (error) {
        console.error('[EmailCache] Error saving index:', error);
    }
};

/**
 * Cache an email
 *
 * @param {object} email - Email object to cache
 * @returns {Promise<boolean>} - Success status
 */
export const cacheEmail = async (email) => {
    try {
        // Ensure index is loaded
        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const emailId = email.id;
        const emailPath = `${EMAIL_CACHE_ROOT}/emails/${emailId}.json`;

        // Calculate email size
        const emailJson = JSON.stringify(email);
        const emailSize = new Blob([emailJson]).size || emailJson.length;

        // Check if we need to evict files
        const maxSizeBytes = MAX_CACHE_SIZE_MB * BYTES_PER_MB;
        const availableSpace = maxSizeBytes - _emailCacheIndex.totalSize;

        if (availableSpace < emailSize) {
            console.log('[EmailCache] Need to evict. Required:', (emailSize / BYTES_PER_MB).toFixed(4), 'MB');
            await evictLRUEmails(emailSize - availableSpace);
        }

        // Save email to file
        await RNFS.writeFile(emailPath, emailJson, 'utf8');

        // Update index
        const existingEntry = _emailCacheIndex.emails[emailId];
        if (existingEntry) {
            // Update existing entry
            _emailCacheIndex.totalSize -= existingEntry.size;
        } else {
            _emailCacheIndex.emailCount++;
        }

        _emailCacheIndex.emails[emailId] = {
            emailId,
            accountEmail: email.accountEmail,
            subject: email.subject,
            from: email.from,
            date: email.date,
            caseKeyword: email.caseKeyword || '',
            size: emailSize,
            localPath: emailPath,
            cachedAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1,
        };

        _emailCacheIndex.totalSize += emailSize;
        await saveEmailCacheIndex();

        console.log('[EmailCache] Cached email:', emailId);
        return true;
    } catch (error) {
        console.error('[EmailCache] Error caching email:', error);
        return false;
    }
};

/**
 * Cache multiple emails
 *
 * @param {Array<object>} emails - Array of email objects
 * @param {string} caseKeyword - Case keyword these emails belong to
 * @returns {Promise<number>} - Number of emails cached
 */
export const cacheEmails = async (emails, caseKeyword = '') => {
    let cachedCount = 0;

    for (const email of emails) {
        const emailWithKeyword = { ...email, caseKeyword };
        const success = await cacheEmail(emailWithKeyword);
        if (success) cachedCount++;
    }

    console.log('[EmailCache] Cached', cachedCount, '/', emails.length, 'emails');
    return cachedCount;
};

/**
 * Get cached email by ID
 *
 * @param {string} emailId - Email ID
 * @returns {Promise<object|null>} - Email object or null
 */
export const getCachedEmail = async (emailId) => {
    try {
        // Ensure index is loaded
        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const cacheEntry = _emailCacheIndex.emails[emailId];
        if (!cacheEntry) {
            return null;
        }

        // Check if file exists
        const exists = await RNFS.exists(cacheEntry.localPath);
        if (!exists) {
            // Remove orphaned entry
            delete _emailCacheIndex.emails[emailId];
            _emailCacheIndex.emailCount--;
            _emailCacheIndex.totalSize -= cacheEntry.size;
            await saveEmailCacheIndex();
            return null;
        }

        // Read and parse email
        const emailJson = await RNFS.readFile(cacheEntry.localPath, 'utf8');
        const email = JSON.parse(emailJson);

        // Update access timestamp
        cacheEntry.lastAccessed = Date.now();
        cacheEntry.accessCount = (cacheEntry.accessCount || 0) + 1;
        await saveEmailCacheIndex();

        return email;
    } catch (error) {
        console.error('[EmailCache] Error getting cached email:', error);
        return null;
    }
};

/**
 * Get cached emails for a case (by keyword)
 *
 * @param {string} caseKeyword - Case subject keyword
 * @returns {Promise<Array>} - Array of email metadata
 */
export const getCachedEmailsForCase = async (caseKeyword) => {
    try {
        // Ensure index is loaded
        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const emails = Object.values(_emailCacheIndex.emails)
            .filter(entry => entry.caseKeyword === caseKeyword)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        return emails;
    } catch (error) {
        console.error('[EmailCache] Error getting cached emails:', error);
        return [];
    }
};

/**
 * Check if email is cached
 *
 * @param {string} emailId - Email ID
 * @returns {Promise<boolean>}
 */
export const isEmailCached = async (emailId) => {
    if (!_emailCacheIndex) {
        await loadEmailCacheIndex();
    }

    const cacheEntry = _emailCacheIndex.emails[emailId];
    if (!cacheEntry) return false;

    // Verify file exists
    const exists = await RNFS.exists(cacheEntry.localPath);
    return exists;
};

/**
 * Evict emails using LRU (Least Recently Used) policy
 *
 * @param {number} bytesNeeded - Bytes to free up
 * @returns {Promise<number>} - Number of emails evicted
 */
const evictLRUEmails = async (bytesNeeded) => {
    try {
        console.log('[EmailCache] Starting LRU eviction. Need to free:', (bytesNeeded / BYTES_PER_MB).toFixed(4), 'MB');

        // Get all emails and sort by lastAccessed (oldest first)
        const allEmails = Object.values(_emailCacheIndex.emails);
        allEmails.sort((a, b) => a.lastAccessed - b.lastAccessed);

        let freedBytes = 0;
        let evictedCount = 0;

        for (const entry of allEmails) {
            if (freedBytes >= bytesNeeded) break;

            // Delete file
            try {
                await RNFS.unlink(entry.localPath);
                console.log('[EmailCache] Evicted:', entry.subject?.substring(0, 30));
            } catch (error) {
                console.warn('[EmailCache] Error deleting file:', entry.localPath);
            }

            // Remove from index
            delete _emailCacheIndex.emails[entry.emailId];
            freedBytes += entry.size;
            _emailCacheIndex.totalSize -= entry.size;
            _emailCacheIndex.emailCount--;
            evictedCount++;
        }

        await saveEmailCacheIndex();

        console.log('[EmailCache] Evicted', evictedCount, 'emails, freed', (freedBytes / BYTES_PER_MB).toFixed(4), 'MB');
        return evictedCount;
    } catch (error) {
        console.error('[EmailCache] Eviction error:', error);
        return 0;
    }
};

/**
 * Remove cached email
 *
 * @param {string} emailId - Email ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeCachedEmail = async (emailId) => {
    try {
        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const cacheEntry = _emailCacheIndex.emails[emailId];
        if (!cacheEntry) {
            return true; // Not an error
        }

        // Delete file
        await RNFS.unlink(cacheEntry.localPath).catch(() => {});

        // Remove from index
        delete _emailCacheIndex.emails[emailId];
        _emailCacheIndex.totalSize -= cacheEntry.size;
        _emailCacheIndex.emailCount--;

        await saveEmailCacheIndex();

        console.log('[EmailCache] Removed:', emailId);
        return true;
    } catch (error) {
        console.error('[EmailCache] Error removing email:', error);
        return false;
    }
};

/**
 * Clear email cache for a specific case
 *
 * @param {string} caseKeyword - Case subject keyword
 * @returns {Promise<boolean>} - Success status
 */
export const clearCacheForCase = async (caseKeyword) => {
    try {
        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const emailsToRemove = Object.entries(_emailCacheIndex.emails)
            .filter(([_, entry]) => entry.caseKeyword === caseKeyword);

        for (const [emailId, entry] of emailsToRemove) {
            try {
                await RNFS.unlink(entry.localPath);
            } catch (error) {
                // Ignore delete errors
            }

            delete _emailCacheIndex.emails[emailId];
            _emailCacheIndex.totalSize -= entry.size;
            _emailCacheIndex.emailCount--;
        }

        await saveEmailCacheIndex();

        console.log('[EmailCache] Cleared', emailsToRemove.length, 'emails for case:', caseKeyword);
        return true;
    } catch (error) {
        console.error('[EmailCache] Error clearing cache for case:', error);
        return false;
    }
};

/**
 * Clear entire email cache
 *
 * @returns {Promise<boolean>} - Success status
 */
export const clearEmailCache = async () => {
    try {
        console.log('[EmailCache] Clearing entire email cache');

        const exists = await RNFS.exists(EMAIL_CACHE_ROOT);
        if (exists) {
            await RNFS.unlink(EMAIL_CACHE_ROOT);
            await RNFS.mkdir(EMAIL_CACHE_ROOT);
            await RNFS.mkdir(`${EMAIL_CACHE_ROOT}/emails`);
        }

        // Reset index
        _emailCacheIndex = {
            version: '1.0',
            totalSize: 0,
            emailCount: 0,
            emails: {},
        };

        await saveEmailCacheIndex();

        console.log('[EmailCache] Cache cleared successfully');
        return true;
    } catch (error) {
        console.error('[EmailCache] Error clearing cache:', error);
        return false;
    }
};

/**
 * Get email cache statistics
 *
 * @returns {Promise<object>}
 */
export const getEmailCacheStats = async () => {
    if (!_emailCacheIndex) {
        await loadEmailCacheIndex();
    }

    const totalSizeMB = _emailCacheIndex.totalSize / BYTES_PER_MB;
    const percentUsed = (totalSizeMB / MAX_CACHE_SIZE_MB) * 100;

    return {
        totalSize: _emailCacheIndex.totalSize,
        totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
        emailCount: _emailCacheIndex.emailCount,
        maxSizeMB: MAX_CACHE_SIZE_MB,
        percentUsed: parseFloat(percentUsed.toFixed(1)),
    };
};

/**
 * Validate email cache integrity
 *
 * @returns {Promise<void>}
 */
const validateEmailCacheIntegrity = async () => {
    try {
        console.log('[EmailCache] Validating cache integrity...');

        if (!_emailCacheIndex) {
            await loadEmailCacheIndex();
        }

        const missingFiles = [];
        let actualTotalSize = 0;

        // Check each cached email
        for (const [emailId, entry] of Object.entries(_emailCacheIndex.emails)) {
            try {
                const exists = await RNFS.exists(entry.localPath);
                if (!exists) {
                    missingFiles.push(emailId);
                } else {
                    const stats = await RNFS.stat(entry.localPath);
                    actualTotalSize += stats.size;
                }
            } catch (error) {
                console.warn('[EmailCache] Error checking file:', entry.localPath);
                missingFiles.push(emailId);
            }
        }

        // Remove missing files from index
        if (missingFiles.length > 0) {
            console.log('[EmailCache] Removing', missingFiles.length, 'orphaned entries');
            missingFiles.forEach(emailId => {
                delete _emailCacheIndex.emails[emailId];
                _emailCacheIndex.emailCount--;
            });
        }

        // Update total size
        _emailCacheIndex.totalSize = actualTotalSize;

        await saveEmailCacheIndex();

        console.log('[EmailCache] Integrity validation complete. Size:', (actualTotalSize / BYTES_PER_MB).toFixed(2), 'MB');
    } catch (error) {
        console.error('[EmailCache] Integrity validation error:', error);
    }
};
