/**
 * CampusFind – Application Configuration
 * Tagline: CampusFind – Find. Report. Reclaim.
 */

export const CONFIG = {
  APP_NAME: 'CampusFind',
  TAGLINE: 'Find. Report. Reclaim.',
  VERSION: '1.0.0',

  // Same-origin API path works in local Vercel development and production.
  API_BASE_URL: '/api/v1',

  // Validation rules
  VALIDATION: {
    // Basic email format validator (not claiming full RFC 5322 compliance)
    BASIC_EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 8,
    // Institution-specific domain restriction is configurable and disabled by default
    ENFORCE_INSTITUTION_DOMAIN: false,
    ALLOWED_DOMAINS: [] // e.g. ['@university.edu'] once institution confirms
  },

  // Available Categories
  CATEGORIES: [
    { id: 'cat_electronics', name: 'Electronics & Gadgets', icon: 'smartphone' },
    { id: 'cat_bags', name: 'Bags, Wallets & Purses', icon: 'briefcase' },
    { id: 'cat_stationery', name: 'Books & Stationery', icon: 'book' },
    { id: 'cat_clothing', name: 'Clothing & Accessories', icon: 'tag' },
    { id: 'cat_ids', name: 'Student IDs & Bank Cards', icon: 'credit-card' },
    { id: 'cat_keys', name: 'Keys & Keychains', icon: 'key' },
    { id: 'cat_bottles', name: 'Bottles & Flasks', icon: 'coffee' },
    { id: 'cat_other', name: 'Other Belongings', icon: 'package' }
  ],

  // Common Campus Locations
  LOCATIONS: [
    'Main University Library',
    'Student Center / Union',
    'Science Complex (Block A)',
    'Engineering Building (Block B)',
    'Campus Dining Hall / Cafeteria',
    'Sports Complex & Gym',
    'Central Lecture Theatres',
    'Main Gate & Bus Stop',
    'Hostel / Residence Quad'
  ],

  // Report & Claim Status Constants
  STATUS: {
    REPORT: {
      LOST: 'lost',
      FOUND: 'found',
      RESOLVED: 'resolved',
      ARCHIVED: 'archived'
    },
    CLAIM: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    }
  },

  // User Roles
  ROLES: {
    STUDENT: 'student',
    ADMIN: 'admin'
  },

};
