/**
 * CampusFind – Image Utility Pipeline
 * Handles instant client-side previews (Object URLs), thumbnail scaling (HTML5 Canvas),
 * and IndexedDB storage for mock persistence without exceeding localStorage quotas.
 */

const DB_NAME = 'CampusFind_Asset_DB';
const STORE_NAME = 'images';
let dbInstance = null;

// Initialize IndexedDB asynchronously for mock image persistence
function openImageDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => {
      console.warn('CampusFind: IndexedDB unavailable, falling back to in-memory previews.', e);
      resolve(null);
    };
  });
}

export const ImageUtil = {
  /**
   * Generates a fast, zero-storage preview URL for a selected File
   * @param {File} file
   * @returns {string} Object URL
   */
  createPreviewUrl(file) {
    if (!file) return '';
    return URL.createObjectURL(file);
  },

  /**
   * Cleanly revokes an object URL to prevent memory leaks
   * @param {string} url
   */
  revokePreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  },

  /**
   * Resizes an image file using an offscreen canvas to a lightweight thumbnail
   * @param {File} file
   * @param {number} maxWidth
   * @param {number} maxHeight
   * @param {number} quality (0 to 1)
   * @returns {Promise<Blob>}
   */
  compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas image compression failed'));
        }, 'image/jpeg', quality);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };

      img.src = objectUrl;
    });
  },

  /**
   * Saves an image blob to IndexedDB for offline/prototype persistence
   * @param {string} id
   * @param {Blob} blob
   * @returns {Promise<boolean>}
   */
  async saveImageToDB(id, blob) {
    try {
      const db = await openImageDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, blob, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /**
   * Retrieves an image blob from IndexedDB and creates a display URL
   * @param {string} id
   * @returns {Promise<string|null>}
   */
  async getImageFromDB(id) {
    try {
      const db = await openImageDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result && request.result.blob) {
            resolve(URL.createObjectURL(request.result.blob));
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
};
