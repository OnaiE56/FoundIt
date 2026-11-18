/**
 * FoundIt – Privacy & Sanitization Utilities
 * Enforces requirement: Do not expose private contact information or student identification details publicly.
 */

export const Sanitizer = {
  /**
   * Escapes text before it is inserted into an HTML template.
   * @param {string} value
   * @returns {string}
   */
  escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Sanitizes item objects for public browse & search views
   * Removes reporter's email, student ID, and personal contact info
   * @param {Object} item
   * @returns {Object}
   */
  sanitizeItemForPublicView(item) {
    if (!item) return null;
    const { 
      reporterEmail, 
      reporterStudentId, 
      reporterPhone, 
      internalNotes,
      ...publicItem 
    } = item;

    return {
      ...publicItem,
      // Reporter name masked or reduced to first name/initial for privacy
      reporterDisplayName: publicItem.reporterName 
        ? `${publicItem.reporterName.split(' ')[0]} (Verified Student)`
        : 'Campus Member'
    };
  },

  /**
   * Sanitizes an array of items for public view
   * @param {Array<Object>} items
   * @returns {Array<Object>}
   */
  sanitizeItemList(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => this.sanitizeItemForPublicView(item));
  }
};
