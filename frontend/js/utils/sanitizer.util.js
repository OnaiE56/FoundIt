/**
 * CampusFind – Privacy & Sanitization Utilities
 * Enforces requirement: Do not expose private contact information or student identification details publicly.
 */

export const Sanitizer = {
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
