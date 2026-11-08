/**
 * CampusFind – Validation Utilities
 * Note: Uses a practical, basic email-format validator for standard user input.
 */

import { CONFIG } from '../config.js';

export const Validator = {
  /**
   * Basic email format validator (checks general username@domain.tld structure)
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (!CONFIG.VALIDATION.BASIC_EMAIL_REGEX.test(trimmed)) {
      return false;
    }
    // Optional institutional domain check (if configured in future)
    if (CONFIG.VALIDATION.ENFORCE_INSTITUTION_DOMAIN) {
      return CONFIG.VALIDATION.ALLOWED_DOMAINS.some(domain => trimmed.toLowerCase().endsWith(domain.toLowerCase()));
    }
    return true;
  },

  /**
   * Password validator (minimum length, non-empty)
   * @param {string} password
   * @returns {{ isValid: boolean, message?: string }}
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Password is required' };
    }
    if (password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `Password must be at least ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters long` 
      };
    }
    return { isValid: true };
  },

  /**
   * Validates matching passwords for registration
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {boolean}
   */
  passwordsMatch(password, confirmPassword) {
    return password === confirmPassword && password.length > 0;
  },

  /**
   * Required field check
   * @param {string} val
   * @returns {boolean}
   */
  isNotEmpty(val) {
    return val !== undefined && val !== null && String(val).trim().length > 0;
  },

  /**
   * Basic string escaping to prevent XSS during dynamic DOM rendering
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
