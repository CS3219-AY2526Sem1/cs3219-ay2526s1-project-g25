import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { redisRepo } from '../repos/redisRepo.js';

// In-memory store for Yjs documents
const ydocs = new Map();

/**
 * Get or create a Yjs document for a session
 */
export function getYDoc(sessionId) {
  if (ydocs.has(sessionId)) {
    return ydocs.get(sessionId);
  }

  const ydoc = new Y.Doc();
  ydoc.on('update', async (update, origin) => {
    if (origin !== 'redis') {
      // Save update to Redis when document changes
      try {
        const key = `collab:yjs:${sessionId}`;
        await redisRepo.setJson(key, {
          update: Array.from(update),
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('[YjsService] Failed to save to Redis:', err);
      }
    }
  });

  ydocs.set(sessionId, ydoc);
  return ydoc;
}

/**
 * Load a Yjs document from Redis
 */
export async function loadYDocFromRedis(sessionId) {
  const ydoc = getYDoc(sessionId);
  
  try {
    const key = `collab:yjs:${sessionId}`;
    const stored = await redisRepo.getJson(key);
    
    if (stored && stored.update) {
      // Apply the stored update without triggering the update handler
      Y.applyUpdate(ydoc, new Uint8Array(stored.update));
    }
  } catch (err) {
    console.error('[YjsService] Failed to load from Redis:', err);
  }
  
  return ydoc;
}

/**
 * Handle a Yjs update from a client
 */
export async function applyYjsUpdate(sessionId, update, userId) {
  const ydoc = getYDoc(sessionId);
  
  try {
    // Apply the update
    Y.applyUpdate(ydoc, new Uint8Array(update), 'client');
    
    // Get the text content from the document (using 'monaco' key to match frontend)
    const ytext = ydoc.getText('monaco');
    const text = ytext.toString();
    
    // Also save to old Redis key for backward compatibility with test execution
    try {
      await redisRepo.setJson(`collab:document:${sessionId}`, {
        text: text,
        version: Date.now() // Use timestamp as version
      });
      console.log(`[YjsService] Saved text to collab:document:${sessionId}`);
    } catch (err) {
      console.error('[YjsService] Failed to save to old key:', err);
    }
    
    return {
      success: true,
      text,
      version: ydoc.transactionOrigin
    };
  } catch (err) {
    console.error('[YjsService] Failed to apply update:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Create an awareness instance for a session
 */
const awarenessInstances = new Map();

export function getAwareness(sessionId) {
  if (awarenessInstances.has(sessionId)) {
    return awarenessInstances.get(sessionId);
  }
  
  const ydoc = getYDoc(sessionId);
  const awareness = new awarenessProtocol.Awareness(ydoc);
  awarenessInstances.set(sessionId, awareness);
  
  return awareness;
}

/**
 * Clean up resources for a session
 */
export function cleanupSession(sessionId) {
  ydocs.delete(sessionId);
  awarenessInstances.delete(sessionId);
}
